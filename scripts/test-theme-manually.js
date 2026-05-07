// Paste this entire code block into your browser console (F12)

console.log('=== THEME DEBUG TEST ===');

// 1. Check if dark class exists
console.log('1. Dark class on HTML?', document.documentElement.classList.contains('dark'));
console.log('   HTML classes:', document.documentElement.className);

// 2. Check CSS variables
console.log('2. CSS Variable --color-bg-primary:',
  getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim());

// 3. Toggle dark class manually
console.log('3. Toggling dark class...');
document.documentElement.classList.toggle('dark');

// 4. Check again after toggle
console.log('4. After toggle:');
console.log('   Dark class?', document.documentElement.classList.contains('dark'));
console.log('   CSS Variable:',
  getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim());

// 5. Check body background color
console.log('5. Body computed background:',
  getComputedStyle(document.body).backgroundColor);

// 6. Test localStorage
console.log('6. LocalStorage theme:',
  localStorage.getItem('alpha-signal-theme'));

console.log('=== END DEBUG ===');
console.log('Did you see the colors change? If YES, the CSS works but button has issue.');
console.log('If NO, the CSS variables are not working.');
