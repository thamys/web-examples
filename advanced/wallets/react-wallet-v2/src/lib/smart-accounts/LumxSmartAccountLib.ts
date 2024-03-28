import { Hex, Address, Chain } from 'viem'
import { JsonRpcProvider } from '@ethersproject/providers'
import axios, { AxiosInstance } from 'axios'

type ClientConfig = {
  id: string
  name: string
  createdAt: Date
}

type SmartAccountLumx = {
  id: string
  address: `0x${string}`
  tokens: {
    ethereum: []
    polygon: []
  }
}

export class LumxSmartAccountLib {
  // Options
  protected protocol: AxiosInstance
  protected client: ClientConfig | undefined
  public chain: Chain

  private walletId: string | undefined

  public account: SmartAccountLumx | undefined

  // Utility
  public type: string = 'Lumx'
  public initialized = false

  public constructor({ walletId, chain }: { walletId?: string; chain: Chain }) {
    const protocol = axios.create({
      baseURL: process.env.NEXT_PUBLIC_LUMX_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_LUMX_KEY}` }
    })
    this.chain = chain
    this.protocol = protocol
    this.walletId = walletId
  }

  async getClientConfig() {
    const { data } = await this.protocol.get<ClientConfig>('/account')
    return data
  }

  async getAccount() {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    if (this.walletId) {
      const { data } = await this.protocol.get<SmartAccountLumx>(`/wallets/${this.walletId}`)
      return data
    }
    const { data } = await this.protocol.post<SmartAccountLumx>(`/wallets`)
    return data
  }

  async init() {
    if (!this.protocol) {
      throw new Error('Protocol not initialized')
    }
    this.client = await this.getClientConfig()
    this.account = await this.getAccount()
    this.initialized = true
  }

  getAddress(): string {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    return this.account?.address || ''
  }

  async signMessage(message: string): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    const { data: signature } = await this.protocol.post<string>(`/wallets/sign-message`, {
      message
    })
    return signature || ''
  }

  async _signTypedData(
    domain: any,
    types: any,
    data: any,
    _primaryType?: string | undefined
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    console.log('Signing typed data with Smart Account', { type: this.type, domain, types, data })
    const primaryType = _primaryType || ''
    const { data: signature } = await this.protocol.post<string>(`/wallets/sign-message`, {
      domain,
      types,
      primaryType,
      message: data
    })
    return signature || ''
  }

  connect(_provider: JsonRpcProvider): any {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    return this
  }

  async signTransaction(transaction: any): Promise<string> {
    if (!this.client || !this.account) {
      throw new Error('Client not initialized')
    }
    const { data: signature } = await this.protocol.post<string>(`/wallets/sign-message`, {
      transaction
    })
    return signature || ''
  }

  async sendTransaction({ to, value, data }: { to: Address; value: bigint; data: Hex }) {
    if (!this.client || !this.account) {
      throw new Error('Client not initialized')
    }

    const { data: txResult } = await this.protocol.post(`/wallets/${this.walletId}/send`, {
      to,
      value,
      data,
      account: this.account,
      chain: this.chain
    })
    console.log('Transaction completed', { txResult })

    return txResult
  }
}
