"""Refuse a green publication gate when Maven skipped Docker integration tests."""
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

reports = sorted(Path(sys.argv[1]).glob("TEST-*.xml"))
if not reports:
    sys.exit("No Surefire reports; API checks not established")
totals = {key: 0 for key in ("tests", "failures", "errors", "skipped")}
for path in reports:
    suite = ET.parse(path).getroot()
    for key in totals:
        totals[key] += int(suite.get(key, "0"))
print("API test reports:", totals)
if totals["tests"] == 0 or any(totals[key] for key in ("failures", "errors", "skipped")):
    sys.exit("API tests must run without failures/errors/skips before publication")
