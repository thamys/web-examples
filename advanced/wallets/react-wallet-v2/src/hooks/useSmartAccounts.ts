import SettingsStore from '@/store/SettingsStore'
import {
  createOrRestoreKernelSmartAccount,
  createOrRestoreLumxSmartAccount,
  createOrRestoreSafeSmartAccount,
  smartAccountWallets
} from '@/utils/SmartAccountUtil'

import { useSnapshot } from 'valtio'

export default function useSmartAccounts() {
  const { smartAccountEnabled, kernelSmartAccountEnabled, safeSmartAccountEnabled, lumxSmartAccountEnabled } = useSnapshot(
    SettingsStore.state
  )

  const initializeSmartAccounts = async (privateKey: string) => {
    if (smartAccountEnabled) {
      if (kernelSmartAccountEnabled) {
        const { kernelSmartAccountAddress } = await createOrRestoreKernelSmartAccount(privateKey)
        SettingsStore.setKernelSmartAccountAddress(kernelSmartAccountAddress)
      }
      if (safeSmartAccountEnabled) {
        const { safeSmartAccountAddress } = await createOrRestoreSafeSmartAccount(privateKey)
        SettingsStore.setSafeSmartAccountAddress(safeSmartAccountAddress)
      }
      if (lumxSmartAccountEnabled) {
        const { lumxSmartAccountAddress } = await createOrRestoreLumxSmartAccount(privateKey)
        SettingsStore.setLumxSmartAccountAddress(lumxSmartAccountAddress)
      }
    }
  }

  const getAvailableSmartAccounts = () => {
    if (!smartAccountEnabled) {
      return []
    }
    const accounts = []
    for (const [key, lib] of Object.entries(smartAccountWallets)) {
      accounts.push({
        address: key.split(':')[1],
        type: lib.type,
        chain: lib.chain
      })
    }

    return accounts
  }

  return {
    initializeSmartAccounts,
    getAvailableSmartAccounts
  }
}
