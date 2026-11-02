import { onBeforeUnmount, onMounted } from 'vue';

export function useFrame(callback: (now: number) => void): void {
  let id = 0;
  const loop = (now: number) => {
    callback(now);
    id = requestAnimationFrame(loop);
  };
  onMounted(() => (id = requestAnimationFrame(loop)));
  onBeforeUnmount(() => cancelAnimationFrame(id));
}
