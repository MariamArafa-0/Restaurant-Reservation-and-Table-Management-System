class Feedback {
    constructor(customerId, rating, text, dateISO) {
        this.id = Date.now();
        this.customerId = customerId;
        this.rating = Number(rating);
        this.text = text || '';
        this.date = dateISO || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    }
}

module.exports = Feedback;
