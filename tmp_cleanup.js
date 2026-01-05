const http = require('http')
const loginUrl = 'http://localhost:3000/auth/login?username=alice&password=password1'
http.get(loginUrl, res => {
  let d = ''
  res.on('data', c => d += c)
  res.on('end', () => {
    try {
      const parsed = JSON.parse(d)
      if (!parsed.access_token) return console.error('no access_token in login response:', d)
      const token = parsed.access_token
      const options = {
        method: 'DELETE',
        host: 'localhost',
        port: 3000,
        path: '/posts/cleanup-orphans',
        headers: { Authorization: `Bearer ${token}` }
      }
      const req = http.request(options, res2 => {
        let r = ''
        res2.on('data', c => r += c)
        res2.on('end', () => {
          console.log('cleanup response:', r || `<empty, status ${res2.statusCode}>`)
        })
      })
      req.on('error', e => console.error('cleanup request error', e.message))
      req.end()
    } catch (e) {
      console.error('login parse failed', e.message, 'raw:', d)
    }
  })
}).on('error', e => console.error('login request failed', e.message))
