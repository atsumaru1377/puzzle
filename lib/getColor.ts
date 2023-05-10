class SeededRandom {
    private seed: number;
  
    constructor(seed: number) {
        this.seed = seed; 
    }
  
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

const getSeededRandomColor = (seed: number): string => {
    const random = new SeededRandom(seed);
    const r = Math.floor(random.next() * 256);
    const g = Math.floor(random.next() * 256);
    const b = Math.floor(random.next() * 256);
  
    return `rgb(${r}, ${g}, ${b})`;
};
  
export default getSeededRandomColor