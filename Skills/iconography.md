# ReceiptVault — Iconography Specification

## 1. Purpose

Defines strict rules, enforcement mechanisms, and fallback systems for icon usage.

Goals:

- Zero ambiguity in icon meaning
- Consistent usage across the system
- Enforced accessibility compliance
- Prevention of developer misuse
- Self-correcting behavior under failure


## 2. Core Principle

### 2.1 Icons Are Controlled Assets

Icons MUST NOT be freely chosen.

All icons must come from:

- centralized icon registry

No direct usage allowed outside registry.


## 3. Icon Registry (Single Source of Truth)

System MUST define:

action → icon mapping

Examples:

- add → plus
- delete → trash
- edit → pencil
- search → magnifier
- filter → funnel
- export → download
- retry → refresh
- success → check
- error → warning
- offline → disconnected

---

### Rule

- One action = one icon
- One icon = one meaning
- No duplication allowed


## 4. Enforcement Layer (CRITICAL)

System MUST enforce:

- only registered icons allowed
- invalid icon usage is blocked at build time

---

### Validation

IF icon not in registry:

- reject render
- fallback to text


## 5. Icon + Text Enforcement

### Rule

Icons MUST include text when:

- action is critical
- meaning is not universally obvious


### System Enforcement

IF icon-only used where not allowed:

- automatically add text label OR
- block render


## 6. Ambiguity Elimination

### Rule

Every icon must pass:

- meaning clarity test


### Validation

IF icon has multiple interpretations:

- must include text
- OR be replaced with clearer icon


## 7. Accessibility Guarantee

### Requirements

All icons MUST have:

- aria-label
- role="img" or appropriate semantic role

---

### Enforcement

IF missing label:

- auto-generate from registry
- OR block render


## 8. Touch Target Protection

### Rule

Minimum touch size:

- 44px x 44px

---

### Enforcement

IF icon clickable AND too small:

- wrap in touch container
- auto-expand hit area


## 9. Size System

Standard sizes:

- small: 16px
- medium: 20px
- large: 24px

---

### Rule

- icons must snap to nearest size
- no arbitrary scaling


## 10. Alignment System

### Rules

- align to text baseline
- center within containers

---

### Enforcement

- auto-align via layout system
- prevent manual offset hacks


## 11. Color Independence

### Rule

Meaning must NOT depend on color

---

### Enforcement

- icon must remain understandable in grayscale
- require text or label support


## 12. Theme Safety (Dark/Light)

### Rule

Icons must adapt automatically to theme

---

### Enforcement

- inherit color from text
- validate contrast ratio


## 13. Interactive Behavior

### Clickable Icons

- must have visible feedback (active state)
- must not rely on hover only

---

### Mobile Protection

- no hover-only interactions allowed


## 14. Loading Icon Control

### Rule

- ONLY spinner allowed for loading

---

### Enforcement

- static icons cannot represent loading


## 15. Performance Optimization

### Rules

- use inline SVG
- optimize path size

---

### Enforcement

- reject large/unoptimized icons


## 16. SVG Stability Protection

### Rules

- normalize stroke width
- remove unsupported attributes

---

### Enforcement

- sanitize SVG before use


## 17. Icon Library Control

### Rule

- only ONE icon library allowed

---

### Enforcement

- block multiple libraries
- lock version


## 18. Version Control

### Rule

- icons must be versioned

---

### Behavior

- changes must not silently affect existing UI


## 19. Fallback System

IF icon fails to load:

- replace with text label
- preserve layout space


## 20. Error Prevention Layer

System must detect:

- wrong icon mapping
- duplicate meanings
- missing icons

---

### Response

- auto-correct OR block render


## 21. Visual Noise Control

### Rule

- limit icons per view

---

### Enforcement

- prevent excessive icon usage


## 22. International Clarity

### Rule

Icons must be globally understandable

---

### Enforcement

- avoid culturally specific symbols
- require text where needed


## 23. Animation Control

### Rule

- animations allowed ONLY when meaningful

---

### Enforcement

- block decorative animations


## 24. Layout Stability

### Rule

Icons must NOT:

- shift layout
- overlap content

---

### Enforcement

- fixed container sizing


## 25. Self-Healing System

System must:

- detect missing icons
- replace with fallback
- re-render when fixed


## 26. Forbidden Patterns

- icon without meaning  
- icon without label (where required)  
- multiple icons for same action  
- color-only meaning  
- hover-only interaction  
- inconsistent sizes  
- mixed icon libraries  


## 27. Final Guarantee

The system guarantees:

- icons are consistent and predictable
- no ambiguity in meaning
- accessibility is always enforced
- developers cannot misuse icons
- system recovers from missing or broken icons
