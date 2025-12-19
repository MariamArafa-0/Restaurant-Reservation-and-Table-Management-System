class Customer {
    constructor(username, password, email, phone) {
        this.id = 'C-' + Date.now();
        this.usernameCus = username;
        this.passwordCus = password;
        this.email = email;
        this.phone = phone;
        this.role = 'Customer';
    }

    static register(username, password, email, phone) {
        return new Customer(username, password, email, phone);
    }

    login(inputPassword,inputEmail) {
    return this.email === inputEmail && this.passwordCus === inputPassword;
    }
}

module.exports = Customer;