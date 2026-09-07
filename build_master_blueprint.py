# -*- coding: utf-8 -*-
"""
HARMOS MASTER BLUEPRINT BUILDER
Compiles Markdown, Executive HTML, and PDF via Headless Edge.
USPTO Patent Application #63/915,788
"""
import os
import sys
import subprocess
import shutil
import fitz
import markdown

sys.path.append(r"C:\Harmos AI")
from sec1_intro import SEC1_INTRO
from sec2_patent import SEC2_PATENT
from sec3_conclave import SEC3_CONCLAVE
from sec4_competitors import SEC4_COMPETITORS
from sec5_scenarios_p1 import SEC5_SCENARIOS_P1
from sec5_scenarios_p2 import SEC5_SCENARIOS_P2
from sec6_technical import SEC6_TECHNICAL
from sec7_hud_and_sec8_roadmap import SEC7_HUD_AND_8_ROADMAP

BASE_DIR = r"C:\Harmos AI"
MD_PATH = os.path.join(BASE_DIR, "HARMOS_PROJECT_BLUEPRINT.md")
HTML_PATH = os.path.join(BASE_DIR, "HARMOS_PROJECT_BLUEPRINT.html")
CSS_PATH = os.path.join(BASE_DIR, "blueprint_style.css")
PDF_PATH = os.path.join(BASE_DIR, "HARMOS_PROJECT_BLUEPRINT.pdf")
DESKTOP_PDF = r"C:\Users\ahmad\Desktop\HARMOS_PROJECT_BLUEPRINT.pdf"
HARMOS_DIR_PDF = r"C:\Harmos\HARMOS_PROJECT_BLUEPRINT.pdf"

print("================================================================================")
print("             HARMOS AI — MASTER BLUEPRINT COMPILATION PIPELINE                  ")
print("================================================================================")

# 1. Assemble Full Markdown
full_md = "\n\n".join([
    SEC1_INTRO,
    SEC2_PATENT,
    SEC3_CONCLAVE,
    SEC4_COMPETITORS,
    SEC5_SCENARIOS_P1,
    SEC5_SCENARIOS_P2,
    SEC6_TECHNICAL,
    SEC7_HUD_AND_8_ROADMAP
])

with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write(full_md)
print(f"[SUCCESS] Markdown compiled: {MD_PATH} ({len(full_md)} chars)")

# 2. Convert Markdown to HTML
html_body = markdown.markdown(full_md, extensions=["tables", "fenced_code", "toc"])

# 3. Read CSS
with open(CSS_PATH, "r", encoding="utf-8") as f:
    css_content = f.read()

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>HARMOS AI — Autonomous Agent Verification & Safety Gateway Blueprint</title>
  <style>
{css_content}
  </style>
</head>
<body>
  <div class="executive-badge">CONFIDENTIAL • INVESTOR & ARCHITECTURAL DOSSIER • USPTO #63/915,788</div>
  {html_body}
  <div class="footer-seal">
    <strong>Harmos AI</strong> • Sovereign Autonomous Agent Verification Gateway • Patent Application #63/915,788<br>
    Principal Architect: Wali Ahmad • September 2026 • All Rights Reserved
  </div>
</body>
</html>"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_template)
print(f"[SUCCESS] Executive HTML compiled: {HTML_PATH}")

# 4. Compile PDF with Headless Edge
edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_exe):
    edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if not os.path.exists(edge_exe):
    print(f"[ERROR] Edge executable not found at: {edge_exe}")
    sys.exit(1)

print(f"[EDGE] Found Edge at: {edge_exe}")
print("[EDGE] Invoking Headless Chromium rendering engine...")

cmd = [
    edge_exe,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    f"--print-to-pdf={PDF_PATH}",
    f"file:///{HTML_PATH.replace(os.sep, '/')}"
]

res = subprocess.run(cmd, capture_output=True, text=True)

if os.path.exists(PDF_PATH) and os.path.getsize(PDF_PATH) > 1000:
    doc = fitz.open(PDF_PATH)
    page_count = len(doc)
    size_kb = os.path.getsize(PDF_PATH) / 1024
    print("================================================================================")
    print("                      PDF COMPILATION VERIFIED SUCCESSFUL                       ")
    print("================================================================================")
    print(f" • File Path:    {PDF_PATH}")
    print(f" • File Size:    {size_kb:.1f} KB")
    print(f" • Page Count:   {page_count} pages")
    print("--------------------------------------------------------------------------------")

    # Mirror copies to Desktop (local and OneDrive) and C:\Harmos
    onedrive_desktop = os.path.expanduser(r"~\OneDrive\Desktop\HARMOS_PROJECT_BLUEPRINT.pdf")
    local_desktop = os.path.expanduser(r"~\Desktop\HARMOS_PROJECT_BLUEPRINT.pdf")
    for dest in [onedrive_desktop, local_desktop]:
        if os.path.exists(os.path.dirname(dest)):
            try:
                shutil.copyfile(PDF_PATH, dest)
                print(f" • Desktop Copy: {dest}")
            except Exception as e:
                pass

    try:
        if os.path.exists(r"C:\Harmos"):
            shutil.copyfile(PDF_PATH, HARMOS_DIR_PDF)
            print(f" • Harmos Copy:  {HARMOS_DIR_PDF}")
    except Exception as e:
        print(f" [!] Harmos copy error: {e}")

    print("================================================================================")
else:
    print(f"[ERROR] PDF generation failed or file empty: {res.stderr}")
    sys.exit(1)

