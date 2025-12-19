const MINIMUM_DEPOSIT_AMOUNT = 500.00;

class Payment {
    constructor(reservationId, username, amount) {
        this.id = 'P-' + Date.now();

        this.reservationId = reservationId;
        this.depositAmount = amount || MINIMUM_DEPOSIT_AMOUNT;
        this.username = username;
        this.paymentDate = new Date().toISOString();
        this.status = 'Pending';
    }

    processDeposit(amount) {
        if (amount >= MINIMUM_DEPOSIT_AMOUNT) {
            this.status = 'Completed';
            return true;
        }
        this.status = 'Failed';
        return false;
    }
}

module.exports = Payment;