A connection can disappear in the middle of an ordinary task. A customer is placing an order, a staff member is recording a visit, or a retailer is serving someone at the counter. The interface still needs to explain what has happened and what the person can do next.

Designing for these moments begins with a product decision: which work can safely continue on the device, and which work needs confirmation from the server?

## Separate a saved draft from a confirmed result

“Saved on this device” and “received by the team” are different promises. An app should communicate that difference clearly.

Consider a field report. It might be reasonable to let someone write notes and attach a photo while offline. The app can show that the report is saved locally and waiting to upload. It should not describe the report as delivered until the server has confirmed receipt.

The same care applies to checkout. Recording a draft order is not the same as confirming stock or receiving a payment. Decide what the product is allowed to promise before designing its offline screen.

## Give pending work a visible home

A small connection icon is rarely enough. People need to know which actions are waiting, which have completed, and which need their attention.

A useful design might include a pending-items list with a clear status for each entry:

- Saved on this device.
- Waiting for a connection.
- Sending.
- Confirmed by the server.
- Needs your attention.

Let people inspect a pending item. If a retry fails, explain whether their work is still saved and what they can do about it.

## Plan for retries and conflicting changes

A request can reach the server even when its response never reaches the phone. Retrying that request must not accidentally create the same order twice. The implementation needs a way to recognize the original operation and return its result when appropriate.

Changes can also conflict. If two people edit the same record before their devices reconnect, the product needs a rule for resolving that situation. Some information can be merged; other changes need a person to review them. A generic success message should not hide an unresolved conflict.

## Test the interruption, not only the happy path

During review, interrupt the connection at different points in a task. Close and reopen the app with pending work. Reconnect after another device has changed the same record. Check what the user sees when the server rejects an update.

Also decide what happens to locally stored information when someone signs out or shares a device. Keeping work available should not mean leaving private information visible to the next person.

An offline experience is a set of carefully defined promises. When the app distinguishes local work from confirmed results and gives people a clear recovery path, a weak connection becomes a situation they can understand rather than a mystery they must solve.
