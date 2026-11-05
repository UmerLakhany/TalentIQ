const bcrypt = require('bcryptjs');

class PasswordManager {

  private readonly saltRounds: number = 10

  async encryptPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(encryptedPassword: string, inputPass: string): Promise<string> {
    return await bcrypt.compare(inputPass, encryptedPassword);
  }

}

export default PasswordManager;