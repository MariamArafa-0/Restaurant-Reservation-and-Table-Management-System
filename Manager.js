class Manager {

    constructor(username, password,email) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = 'Manager';
    }

    login(inputPassword,inputEmail) {
        return this.password === inputPassword && this.email === inputEmail;
    }

}

module.exports = Manager;