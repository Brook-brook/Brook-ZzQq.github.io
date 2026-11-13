# Iteration 20 design audit: a task, then a learning path

## Evidence and scope

Continues the actual pushed `8dc7313` iteration19 head. The renewed five-hour
request explicitly prioritizes AI-development / Agent-development foundations.
The earlier work plan and official source review preceded the new lessons.
Locked lavender/glass tokens and native Jekyll remain; this is a reading app
screen, not a marketing hero or another dashboard.

Existing Study, Knowledge, manual practice and local GIS tools work, but they do
not provide a coherent model/request/agent/retrieval/evaluation starting point.
Adding many unrelated feature tiles would not solve that gap. The new entry
therefore connects actual public notes and existing tools through two open paths,
each with four explicit, ungraded self-explanation questions.

## Actual screenshots changed the design

- Initial390px capture repeated the same article summary at different steps.
  Replaced it with bounded, escaped, authored per-step focus. Reused articles now
  explain what to examine differently rather than pretending to be new lessons.
- The opening was too long. Shortened the one light-glass local-start prompt,
  kept the full runtime/API conditions with the actual Python example, and
  balanced headings without forced line breaks. Breadcrumb spacing is explicit.
- Default axe surfaced a real shared-header label-content-name mismatch at
  tablet/desktop widths. Overriding the link with a different brand name (and
  then a manually assembled label) was brittle. The final fix uses the native
  visible text, makes the compact visible name accessible, and adds a hidden
  home suffix. Real390/768/1440 default axe checks passed without rule suppression.
- A new legacy20 test originally tried reading progress inside a closed native
  practice disclosure. The test now opens that disclosure as a reader would.
  The live reduced-motion assertion waits two browser frames for the media event,
  not an arbitrary animation timeout. Six targeted repeats passed.

No idle loop, new font, image, deep blur, tracking counter or automatic grading.
Native disclosures/anchors remain the full no-JS implementation. Active links
get one-pixel press feedback, removed for reduced motion; instant focus remains.
Article reading and data controls reuse the existing site material.

## Hallmark actually run

Reused the previously read, pinned Hallmark tool rather than claiming a fresh
installation. Scoped CSS + actual compiled URL render wrote five real captures:
1280×800,1440×900,1920×1080 folds, plus1440 and375 full pages. Initial static run
found one missing active-state Reflex; adding meaningful native-link press and
reduced-motion behavior resolved it. Final: **0 FAIL / 0 REFLEX / 0 WARN**.

Fresh-context finish review: **ship, 0 material findings**, no Floor/Reflex issue.
The reviewer opened actual links/fragments, tested native keyboard disclosure,
phone themes, source scope and overflow. A factual report sentence originally
called the route headers pinned; computed style confirmed they are **static**,
and the report was corrected without changing the verdict. No sticky behavior
or additional independent test is inferred. Raw report is retained unchanged
after that correction in iteration-20/finish-review.txt.

The task-specific focuses, actual lab destinations and distinction between
local tools/offline SDK tests/real model inference must survive future polish.
Sources and method verification do not certify model performance or news.

Final artifact inspection also found actual generated Python bytecode being
copied by Jekyll. The test now avoids creating it, Git ignores local development
files, and a recursive artifact guard rejects caches/venvs while allowing the
intentional .py teaching download. Old artifact rejection and clean builds were
verified at both prefixes; no production config was changed.

## Verification limits

Actual Chromium desktop and phone viewports, both themes, keyboard, no-JS,
reduced motion, public-only search, real Python download and original20 journal
roundtrip are tested. Root/project-prefix builds remain separate. Firefox's
official Playwright download was attempted once and blocked403 by environment
policy; no Firefox, Safari, physical-phone or OS-IME pass is claimed. See the
delivery report and raw logs for the final command results.
