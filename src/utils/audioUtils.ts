
export const convertAudioToFloat32 = async (blob: Blob): Promise<Float32Array> => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.getChannelData(0);
};
