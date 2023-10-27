import { createHmac } from 'node:crypto'

class Switchbot {
  private readonly baseUrl: string = 'https://api.switch-bot.com/v1.1'
  private token: string
  private secret: string

  constructor (token: string, secret: string) {
    this.token = token
    this.secret = secret
  }

  private generateHeaders(method: string = 'GET') {
    const t = Date.now().toString()
    const nonce = 'id1'
    const data = this.token + t + nonce
    const signTerm = createHmac('sha256', this.secret).update(data, 'utf8').digest()
    const sign = signTerm.toString('base64')
    const headers: Record<string, string> = { Authorization: this.token, sign, nonce, t }

    if (method === 'POST') {
      headers['Content-Type'] = 'application/json'
    }

    return headers
  }

  private async get(endpoint: string) {
    const headers = this.generateHeaders();
    const url = this.baseUrl + endpoint

    return await fetch(url, { headers })
  }

  private async post(endpoint: string, body: string) {
    const headers = this.generateHeaders('POST');
    const url = this.baseUrl + endpoint

    return await fetch(url, { method: 'POST', headers, body })
  }

  async execCommand(deviceId: string, command: string, parameter: string = 'default', commandType: string = 'command') {
    const body = JSON.stringify({ command, parameter, commandType })
    const response = await this.post(`/devices/${deviceId}/commands`, body)
    const { message } = await response.json()

    return message
  }

  async fetchState(deviceId: string) {
    const response = await this.get(`/devices/${deviceId}/status`)
    const { body } = await response.json()

    return body.lockState
  }
}

export default Switchbot
