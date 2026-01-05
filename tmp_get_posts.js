const http = require('http')
const token = process.argv[2]
if(!token){ console.error('Usage: node tmp_get_posts.js <token>'); process.exit(1)}
const options = { hostname: 'localhost', port: 3000, path: '/posts', method: 'GET', headers: { Authorization: `Bearer ${token}` } }
const req = http.request(options, res => {
  console.log('statusCode:', res.statusCode)
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => console.log('body:', data))
})
req.on('error', e => console.error('error', e.message))
req.end()
