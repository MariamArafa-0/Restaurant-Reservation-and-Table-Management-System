const STATUS_PENDING = 'PENDING';
const STATUS_CONFIRMED = 'CONFIRMED';
const STATUS_CANCELLED = 'CANCELLED';

class Reservation {
    constructor(customerId, tableId, partySize, date, time, comment) {
        this.reservationId = Date.now(); // Generate a unique ID
        this.customerId = customerId;    // <--- Ensure this line exists!
        this.tableId = tableId;
        this.partySize = partySize;
        this.date = date;
        this.time = time;
        this.comment = comment;
        this.status = 'PENDING';
    }
    finalizeReservation(success) {
            if (success) {
                this.status = 'CONFIRMED';
            } else {
                this.status = 'CANCELLED';
            }
        }
}
module.exports = Reservation;