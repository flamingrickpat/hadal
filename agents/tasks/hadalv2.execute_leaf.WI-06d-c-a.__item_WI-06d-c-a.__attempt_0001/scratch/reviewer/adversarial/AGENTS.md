# WI-06d-c-a Reviewer Adversarial Probe

Answers: does the distant-motion impulse bypass the camera-shake flag,
violating the "flag off means no shake from any source" acceptance criterion?

- `impulse_bypasses_flag.ts` — triggers the impulse with the shake flag off and
  on, verifying that flag-off suppresses all shake including impulse-driven
  shake, while flag-on produces it. Also verifies the legacy getImpulseOffset
  API still functions independently.

Probe result: passed. The impulse routes through the shake path and is
suppressed when the flag is off. This result is attached to the
implementation record for WI-06d-c-a.
