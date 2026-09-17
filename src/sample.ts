export const original = `/**
 * Find the index of a target in a sorted array.
 * Returns -1 if the target is not found.
 */
function binarySearch(arr: number[], target: number): number {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (arr[mid] === target) {
      return mid;
    }

    if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}

const numbers = [2, 4, 6, 8, 10, 12];
const result = binarySearch(numbers, 8);
console.log(result);
`;
export const modified = `/**
 * Find the index of a target in a sorted array.
 * Returns -1 if the target is not found.
 */
function binarySearch(arr: number[], target: number): number {
  let low = 0;
  let high = arr.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (arr[mid] === target) {
      return mid;
    }

    if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return -1;
}

const numbers = [2, 4, 6, 8, 10, 12];
const result = binarySearch(numbers, 8);
console.log(\`Found at index: \${result}\`);
`;
