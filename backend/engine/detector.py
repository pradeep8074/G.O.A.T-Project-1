"""
G.O.A.T. Shield Stage 2A - Transparent Rule-Based Fraud Detection Engine
Evaluates transactions against 6 explainable rules and produces transparent risk scores,
status classifications, and audit explanations.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple


RULE_DEFINITIONS = {
    "R1": {
        "name": "FIU-IND Threshold Proximity",
        "weight": 20,
        "description": "Amount structured between ?7,50,000 and ?9,99,999 near regulatory reporting threshold."
    },
    "R2": {
        "name": "Cross-Bank Boundary Crossing",
        "weight": 15,
        "description": "Fund displacement traverses institutional boundaries between distinct banking entities."
    },
    "R3": {
        "name": "Fan-In Multi-Source Concentration",
        "weight": 20,
        "description": "Beneficiary account receives >= 3 inbound transfers within a 60-minute moving window."
    },
    "R4": {
        "name": "Fan-Out High Velocity Dispersion",
        "weight": 20,
        "description": "Originating account executes >= 3 outbound transfers within a 60-minute moving window."
    },
    "R5": {
        "name": "Rapid Pass-Through Velocity",
        "weight": 20,
        "description": "Account receives funds and drains >= 70% outbound within a 60-minute temporal window."
    },
    "R6": {
        "name": "Rapid Structuring & Chain Burst",
        "weight": 15,
        "description": "Account participates in rapid sequential transfers within 30 minutes totaling > ?4,00,000."
    }
}


def parse_time(iso_str: str) -> datetime:
    return datetime.fromisoformat(iso_str)


def detect_frauds(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Evaluates all transactions against the 6 deterministic rules.
    """
    sorted_txns = sorted(transactions, key=lambda x: x["iso_timestamp"])
    
    account_inbounds: Dict[str, List[Tuple[datetime, float, str]]] = {}
    account_outbounds: Dict[str, List[Tuple[datetime, float, str]]] = {}
    account_all: Dict[str, List[Tuple[datetime, float, str]]] = {}

    for t in sorted_txns:
        t_time = parse_time(t["iso_timestamp"])
        amt = t["amount"]
        t_id = t["id"]
        sender = t["sender"]
        receiver = t["receiver"]

        if sender not in account_outbounds:
            account_outbounds[sender] = []
        account_outbounds[sender].append((t_time, amt, t_id))

        if receiver not in account_inbounds:
            account_inbounds[receiver] = []
        account_inbounds[receiver].append((t_time, amt, t_id))

        if sender not in account_all:
            account_all[sender] = []
        account_all[sender].append((t_time, amt, t_id))

        if receiver not in account_all:
            account_all[receiver] = []
        account_all[receiver].append((t_time, amt, t_id))

    enriched_transactions: List[Dict[str, Any]] = []

    for t in sorted_txns:
        t_time = parse_time(t["iso_timestamp"])
        amt = t["amount"]
        sender = t["sender"]
        receiver = t["receiver"]
        is_cross = t.get("is_cross_bank", False)
        
        triggered: List[str] = []
        reasons: List[str] = []

        # R1: FIU-IND Threshold Proximity
        if 750000.0 <= amt <= 999999.0:
            triggered.append("R1")
            reasons.append(f"Amount ?{amt:,.2f} near ?10L threshold (+20)")

        # R2: Cross-Bank Boundary Crossing
        if is_cross:
            triggered.append("R2")
            reasons.append(f"Cross-bank transfer from {t['bank']} (+15)")

        # R3: Fan-In Multi-Source Concentration (Receiver side)
        inbounds = account_inbounds.get(receiver, [])
        in_window_inbounds = [
            x for x in inbounds
            if abs((x[0] - t_time).total_seconds()) <= 3600
        ]
        if len(in_window_inbounds) >= 3:
            triggered.append("R3")
            reasons.append(f"Receiver concentration: {len(in_window_inbounds)} inbound transfers in 60m (+20)")

        # R4: Fan-Out Dispersion Velocity (Sender side)
        outbounds = account_outbounds.get(sender, [])
        in_window_outbounds = [
            x for x in outbounds
            if abs((x[0] - t_time).total_seconds()) <= 3600
        ]
        if len(in_window_outbounds) >= 3:
            triggered.append("R4")
            reasons.append(f"Sender dispersion: {len(in_window_outbounds)} outbound transfers in 60m (+20)")

        # R5: Rapid Pass-Through Velocity
        sender_inbounds = account_inbounds.get(sender, [])
        recent_inbounds_to_sender = [
            x for x in sender_inbounds
            if 0 <= (t_time - x[0]).total_seconds() <= 3600
        ]
        pass_through_detected = False
        for in_t, in_amt, _ in recent_inbounds_to_sender:
            if amt >= 0.70 * in_amt or in_amt >= 0.70 * amt:
                pass_through_detected = True
                break
        
        if not pass_through_detected:
            receiver_outbounds = account_outbounds.get(receiver, [])
            subsequent_outbounds = [
                x for x in receiver_outbounds
                if 0 <= (x[0] - t_time).total_seconds() <= 3600
            ]
            for out_t, out_amt, _ in subsequent_outbounds:
                if out_amt >= 0.70 * amt or amt >= 0.70 * out_amt:
                    pass_through_detected = True
                    break

        if pass_through_detected:
            triggered.append("R5")
            reasons.append("Rapid pass-through: >=70% funds drained within 60m (+20)")

        # R6: Rapid Structuring & Chain Burst
        sender_events = account_all.get(sender, [])
        burst_events = [
            x for x in sender_events
            if abs((x[0] - t_time).total_seconds()) <= 1800
        ]
        total_burst_amt = sum(x[1] for x in burst_events)
        if len(burst_events) >= 2 and total_burst_amt >= 400000.0:
            triggered.append("R6")
            reasons.append(f"Structuring/chain burst: {len(burst_events)} events totaling ?{total_burst_amt:,.2f} in 30m (+15)")

        # Deduplicate triggered rules
        unique_triggered = []
        for r in triggered:
            if r not in unique_triggered:
                unique_triggered.append(r)

        score = sum(RULE_DEFINITIONS[r]["weight"] for r in unique_triggered)
        score = min(100, score)

        if score >= 65:
            status = "High Risk"
        elif score >= 40:
            status = "Review"
        else:
            status = "Normal"

        rule_details = [
            {
                "rule_id": r,
                "name": RULE_DEFINITIONS[r]["name"],
                "points": RULE_DEFINITIONS[r]["weight"],
                "description": RULE_DEFINITIONS[r]["description"]
            }
            for r in unique_triggered
        ]

        if not reasons:
            explanation = "Standard behavioral profile; no anomalous cross-bank or velocity rules triggered."
        else:
            explanation = ". ".join(reasons) + f". Composite Score: {score}/100 ({status})."

        enriched = dict(t)
        enriched["risk_score"] = score
        enriched["status"] = status
        enriched["triggered_rules"] = unique_triggered
        enriched["rule_details"] = rule_details
        enriched["explanation"] = explanation

        enriched_transactions.append(enriched)

    return enriched_transactions
