# MedGemma walkthrough — source code companion

Companion to `../MedGemma-Google-Open-Health-AI-Models-Walkthrough.docx`.

These are the **actual notebook and demo-app sources** that Daniel Golden referenced in the
video "MedGemma: Google's open models for Health AI development" (Startup School: HealthTech,
recorded Sep 23, 2026). Downloaded **2026-09-30** from Google's public repositories.

The video pointed to these only via QR codes and platform names (Hugging Face / Model Garden /
Vertex AI) plus the hub `goo.gle/hai-def`; no direct URLs were shown on screen. The links below were
resolved from the official **MedGemma Release** Hugging Face collection and the `Google-Health` GitHub org.

---

## 1. Notebooks — `medgemma/`

Source: **https://github.com/Google-Health/medgemma** (branch `main`, downloaded 2026-09-30; upstream last updated 2026-09-29).
These are the "example notebooks" Dan describes at **11:12–11:45** (walkthrough step 5.2) — inference and
fine-tuning, on both Hugging Face and Model Garden / Vertex AI.

| Notebook (`medgemma/notebooks/`) | Maps to in the video |
|---|---|
| `quick_start_with_hugging_face.ipynb` | Inference notebook — Hugging Face (11:12 "run the model … evaluate on your own data") |
| `quick_start_with_model_garden.ipynb` | Inference notebook — Vertex AI / Model Garden (11:15) |
| `fine_tune_with_hugging_face.ipynb` | Fine-tuning (LoRA/SFT) notebook (11:29 "how to \[fine-tune\]") |
| `reinforcement_learning_with_hugging_face.ipynb` | RL-based tuning |
| `quick_start_with_dicom.ipynb` | DICOM-aware deployments |
| `ehr_navigator_agent.ipynb` | Demo app ① (also a full app below) |
| `high_dimensional_ct_hugging_face.ipynb` / `..._model_garden.ipynb` | The CT example (step 4.2, ~9:00) |
| `cxr_anatomy_localization_with_hugging_face.ipynb` | Chest-X-ray example (step 4.1, ~7:40) — MedGemma 1.5 |
| `cxr_longitudinal_comparison_with_hugging_face.ipynb` | Chest-X-ray longitudinal comparison — MedGemma 1.5 |
| `high_dimensional_pathology_hugging_face.ipynb` / `..._model_garden.ipynb` | Whole-slide pathology — MedGemma 1.5 |
| `evaluate_on_medqa.ipynb` | MedQA benchmark evaluation |

Also included: `medgemma/python/` (serving, data accessors/processing, `requirements.txt`).

## 2. Demo apps — `demo-apps/`

The **four** demo applications Dan walks through at **16:08–18:19** (walkthrough step 8.1, ~17:30).
The slide shows three numbered previews (①②③); the fourth is described verbally and lives behind the
slide's "Check out **other demo apps**" QR. All four are Hugging Face **Spaces** under `google/`.
(The [MedGemma Release collection](https://huggingface.co/collections/google/medgemma-release-680aade845f90bec6a3f60c4)
lists the first three; the fourth is a separate `google/` Space.) Downloaded 2026-09-30.

| Folder | Video | Hugging Face Space |
|---|---|---|
| `ehr-navigator-agent-with-medgemma/` | App ① — EHR Navigator Agent (MedGemma on Vertex AI ↔ FHIR store) — 16:22 | https://huggingface.co/spaces/google/ehr-navigator-agent-with-medgemma |
| `rad_explain/` | App ② — radiology-report understanding, consumer-facing (frame window read "rad_explain") — 16:46 | https://huggingface.co/spaces/google/rad_explain |
| `appoint-ready/` | App ③ — adaptive pre-visit intake chat ("…prepare a report for your visit") — 17:08 | https://huggingface.co/spaces/google/appoint-ready |
| `rad_learning_companion/` | App ④ — "Radiology Learning Companion": CXR image quiz for clinical training — 17:58 | https://huggingface.co/spaces/google/rad_learning_companion |

Each app includes `app.py`, `Dockerfile`, `requirements.txt`, `README.md`, and its `templates/`,
`static/`, and module code. Dan's caveat (step 8.1): these are demos with mocks — review the code and
reuse pieces rather than copy whole apps.

### Note on skipped binaries (Git LFS)
To keep this to source code, large Git-LFS binaries were **not** materialized — they remain as small
LFS pointer files. Affected: sample videos (`appoint-ready/frontend/public/assets/*.mp4`), cache
databases/archives (`*.db`, `cache_archive.zip`, `radexplain-cache.zip`, `rad-learn-cache.zip`), sample
images (`rad_explain/static/images/*.jpg`, `ehr-navigator-.../static/background.jpg`), and the
`rad_learning_companion/backend/data/*.pdf` guideline. To fetch them, re-clone the Space and run
`git lfs pull`, or download the individual files from the Space page.

### Related `google/` demos NOT downloaded (not among Dan's four)
For awareness — these exist but Dan did not walk through them, so they are intentionally left out:
`google/radextract` (radiology-report *structuring* — and built on **Gemini + LangExtract**, not
MedGemma, per its Space tags) and `google/rad-learn-companion-samples` (the sample CXR image library
used by app ④).

## 3. Canonical links shown in the deck

- Main site (only readable URL on the slides): **goo.gle/hai-def** → https://developers.google.com/health-ai-developer-foundations
- MedGemma on Hugging Face: https://huggingface.co/collections/google/medgemma-release-680aade845f90bec6a3f60c4
- MedGemma on Model Garden: https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/medgemma
- Notebooks repo: https://github.com/Google-Health/medgemma

## Licensing
Repository code is Apache-2.0 (see `medgemma/LICENSE`); the MedGemma **models** are under the
Health AI Developer Foundations License. Demo-app Spaces carry their own `LICENSE`/`README` — check each.
