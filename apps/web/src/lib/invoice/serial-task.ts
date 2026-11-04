/** A failed task must not block later PDF renders. React PDF shares a renderer instance. */
export function createSerialTaskQueue() {
  let previous: Promise<unknown> = Promise.resolve();
  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = previous.then(task, task);
    previous = result.catch(() => undefined);
    return result;
  };
}
