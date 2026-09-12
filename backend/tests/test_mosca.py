import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from intelligence.mosca import assess_mosca

cases = [
    (15, 5, 'BROKEN'),    # 20 > 12 → AT_RISK
    (1, 5, 'BROKEN'),     # 6 < 12 → OK, margin 6
    (2, 3, 'BROKEN'),     # 5 < 12 → OK, margin 7
    (10, 4, 'BROKEN'),    # 14 > 12 → AT_RISK
    (None, 5, 'BROKEN'),  # missing lifetime → NOT_QUANTIFIABLE
    (15, None, 'BROKEN'), # missing migration → NOT_QUANTIFIABLE
    (15, 5, 'RESILIENT'), # not applicable
]
for dl, mt, qs in cases:
    r = assess_mosca(dl, mt, quantum_status=qs)
    print(f'dlf={dl!s:5} mt={mt!s:5} qs={qs:10} -> {r["mosca_status"]:18} urgency={r["migration_urgency"]}')