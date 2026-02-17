---
name: design_guidelines
description: "AutoResponse 프로젝트의 색상, 여백, 폰트 및 UI/UX 일관성을 위한 디자인 가이드라인"
---

# AutoResponse Design System Guidelines

이 가이드라인은 프로젝트 전반에 걸쳐 일관된 UI/UX를 유지하기 위해 필수적으로 준수해야 하는 규칙입니다.

## 🎨 Color Palette
- **Base/Background**: `#FDFFFC` (White Smoke)
- **Primary/Accent**: `#235789` (Deep Blue)
- **Secondary**: `#F1D302` (Yellow Accent - Point color)
- **Neutral**: `#020100` (Rich Black - for text)
- **Error**: `#C1292E` (Red)

## 📐 Spacing & Layout
- **Grid**: 8px 베이스 시스템 (4, 8, 16, 24, 32, 48, 64px)
- **Container**: Max-width `1200px` 중앙 정렬
- **Radius**: `2xl` (1rem) 이상 (둥근 모서리 강조)

## 🔠 Typography
- **Heading**: `Outfit` font (sans-serif), bold
- **Body**: `Inter` font (sans-serif)
- **Accent**: `DM Serif Display` (적절한 헤드라인 포인트로 사용)

## 🍱 UI Component Rules (shadcn/ui 기반)
- **Buttons**: `Primary`는 `#235789` 배경에 흰색 텍스트. `Hover` 시 약간 밝아지는 효과.
- **Cards**: 투명도(`bg-opacity-80`)와 `backdrop-blur`가 적용된 유리 질감 활용.
- **Badges**: 둥글고 작은 보조 색상 배지 사용.

## 💡 UX Principles
- **Clarity**: 정보의 계층 구분을 명확히 (Badge > Heading > Content)
- **Micro-interactions**: 버튼 Hover 및 클릭 시 부드러운 Scale 애니메이션 적용.
- **AI Humanization**: AI 결과물은 보조적인 사각지대에 배치하되 접근성은 높게 유지.
