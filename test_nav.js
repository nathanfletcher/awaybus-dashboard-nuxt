const fs = require('fs');
const file = 'layouts/default.vue';
let content = fs.readFileSync(file, 'utf8');
console.log(content.includes('v-app-bar-nav-icon'));
