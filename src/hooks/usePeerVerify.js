export default function usePeerVerify() {
  const verify = async (classId, peerId) => {
    // Simulating Bluetooth/GPS handshake
    console.log(`Verifying attendance for ${classId} with peer ${peerId}`)
    return true
  }
  return { verify }
}
