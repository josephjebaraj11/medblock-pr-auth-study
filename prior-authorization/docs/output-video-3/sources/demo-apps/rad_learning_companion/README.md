---
title: Radiology Learning Companion
emoji: 🏃
colorFrom: indigo
colorTo: indigo
sdk: docker
pinned: false
license: apache-2.0
short_description: A demo showcasing a medical learning experience of CXR image
---

**Radiology Learning Companion Demo – Built with MedGemma**

Imagine a learning environment where interacting directly with a Chest X-Ray (CXR) image significantly boosts your understanding. That's precisely what the Radiology Learning Companion Demo offers. This web application is an interactive educational tool tailored for medical students—to hone their radiological assessment skills for CXRs.

Radiology Learning Companion Demo demonstrates how to harness MedGemma's multimodal capabilities, combining medical image interpretation and robust medical reasoning. In this demo we show that users can start by selecting an image from a library of 2 CXRs. Developers can build their own library of images. This demo uses MedGemma's internal radiological assessment hypothesis and relevant clinical guidelines, and presents the user with a series of targeted multiple-choice questions. 

After the user goes through their learning journey, Radiology Learning Companion Demo reveals its own interpretation, providing a clear rationale based on CXR findings and established guidelines. It then offers a comparative analysis against your responses, designed to deepen your understanding and validate your clinical observations. 

You as a developer can use this approach to include other guidelines using RAG or other prompts and context to tailor and build such a learning companion.

*Note: This demo utilizes non-DICOM Chest X-Ray (CXR) images, each paired with a curated single condition label. Our labeling strategy prioritizes educationally relevant findings to power a focused and effective simulated learning experience for demo purpose only. This demonstration is solely for illustrative purposes and doesn't represent a finished or approved product. It does not comply with any harmonized regulations or standards for quality, safety, or efficacy. Any real-world application would require further development, training, and adaptation.*
