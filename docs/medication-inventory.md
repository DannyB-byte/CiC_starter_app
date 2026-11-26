# Medication feature inventory

The pre-diary application at commit `e2a4137` contains medication UI mock data, not a medication-management feature:

- The dashboard reminder card names Ondansetron, says “Take 1 tablet with food,” shows an 8:00 PM reminder, and displays “2 of 3 taken today” progress. Its check button is not wired to persist an action.
- The Medications overview lists Ondansetron (“1 tablet · Due at 8:00 PM”) and Dexamethasone (“2 tablets · Completed today”). Its Add new and row controls are presentation-only.
- Medication examples also appear in the dashboard and are static React literals; there is no medication model, storage, reminder scheduler, or prescribing integration.

These are prototype examples only and are not patient-specific medication instructions. The untouched state is recoverable from the `medication-inventory-baseline` Git tag.
