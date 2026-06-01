const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// Store rooms in memory
const rooms = new Map()

function getRoom(socket) {
  return rooms.get(socket.roomId)
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    cors: { origin: '*' },
    path: '/api/socketio',
  })

  io.on('connection', (socket) => {
    console.log('🔌 Connected:', socket.id)

    // Join room
    socket.on('join-room', ({ roomId, password, username }) => {
      const room = rooms.get(roomId)

      if (room) {
        if (room.password && room.password !== password) {
          socket.emit('join-error', 'Contraseña incorrecta')
          return
        }
        room.users.set(socket.id, username)
        socket.join(roomId)
        socket.roomId = roomId
        socket.username = username

        socket.emit('room-state', {
          messages: room.messages,
          comunicacion: room.comunicacion,
          scrollData: room.scrollData,
          autoScrollData: room.autoScrollData,
          postIts: room.postIts,
          users: Array.from(room.users.values()),
        })

        io.to(roomId).emit('user-joined', {
          username,
          users: Array.from(room.users.values()),
        })
      } else {
        const newRoom = {
          password: password || null,
          messages: [],
          comunicacion: { messages: [], draft: '' },
          scrollData: { lines: [], currentLine: 0, fileName: '' },
          autoScrollData: { lines: [], currentLine: 0, fileName: '', isPlaying: false, interval: 3000 },
          postIts: [],
          users: new Map([[socket.id, username]]),
        }
        rooms.set(roomId, newRoom)
        socket.join(roomId)
        socket.roomId = roomId
        socket.username = username

        socket.emit('room-state', {
          messages: [],
          comunicacion: newRoom.comunicacion,
          scrollData: newRoom.scrollData,
          autoScrollData: newRoom.autoScrollData,
          postIts: [],
          users: [username],
        })

        io.to(roomId).emit('user-joined', {
          username,
          users: [username],
        })
      }

      console.log(`👤 ${username} joined room ${roomId}`)
    })

    // === COMUNICACION ENTER ===
    socket.on('send-message', (msg) => {
      const room = getRoom(socket)
      if (!room) return
      const message = { ...msg, author: socket.username, id: Date.now() + '-' + socket.id }
      room.messages.push(message)
      io.to(socket.roomId).emit('new-message', message)
    })

    socket.on('toggle-bold', (messageId) => {
      const room = getRoom(socket)
      if (!room) return
      const msg = room.messages.find(m => m.id === messageId)
      if (msg) { msg.bold = !msg.bold; io.to(socket.roomId).emit('message-updated', msg) }
    })

    socket.on('toggle-highlight', (messageId) => {
      const room = getRoom(socket)
      if (!room) return
      const msg = room.messages.find(m => m.id === messageId)
      if (msg) { msg.highlight = !msg.highlight; io.to(socket.roomId).emit('message-updated', msg) }
    })

    socket.on('clear-messages', () => {
      const room = getRoom(socket)
      if (!room) return
      room.messages = []
      io.to(socket.roomId).emit('messages-cleared')
    })

    // === COMUNICACION TIEMPO REAL ===
    socket.on('com-keystroke', (data) => {
      const room = getRoom(socket)
      if (!room) return
      room.comunicacion = data
      io.to(socket.roomId).emit('com-update', data)
    })

    socket.on('com-confirm', (data) => {
      const room = getRoom(socket)
      if (!room) return
      room.comunicacion = data
      io.to(socket.roomId).emit('com-update', data)
    })

    socket.on('com-clear', () => {
      const room = getRoom(socket)
      if (!room) return
      room.comunicacion = { messages: [], draft: '' }
      io.to(socket.roomId).emit('com-update', room.comunicacion)
    })

    // === SCROLL MANUAL ===
    socket.on('scroll-load', ({ lines, fileName }) => {
      const room = getRoom(socket)
      if (!room) return
      room.scrollData = { lines, currentLine: 0, fileName }
      io.to(socket.roomId).emit('scroll-state', room.scrollData)
    })

    socket.on('scroll-move', (currentLine) => {
      const room = getRoom(socket)
      if (!room) return
      room.scrollData.currentLine = currentLine
      io.to(socket.roomId).emit('scroll-line', currentLine)
    })

    // === AUTO-SCROLL ===
    socket.on('autoscroll-load', ({ lines, fileName }) => {
      const room = getRoom(socket)
      if (!room) return
      room.autoScrollData = { ...room.autoScrollData, lines, currentLine: 0, fileName, isPlaying: false }
      io.to(socket.roomId).emit('autoscroll-state', room.autoScrollData)
    })

    socket.on('autoscroll-play', (isPlaying) => {
      const room = getRoom(socket)
      if (!room) return
      room.autoScrollData.isPlaying = isPlaying
      io.to(socket.roomId).emit('autoscroll-playing', isPlaying)
    })

    socket.on('autoscroll-move', (currentLine) => {
      const room = getRoom(socket)
      if (!room) return
      room.autoScrollData.currentLine = currentLine
      io.to(socket.roomId).emit('autoscroll-line', currentLine)
    })

    socket.on('autoscroll-speed', (interval) => {
      const room = getRoom(socket)
      if (!room) return
      room.autoScrollData.interval = interval
      io.to(socket.roomId).emit('autoscroll-interval', interval)
    })

    // === POST-ITS ===
    socket.on('add-postit', (postIt) => {
      const room = getRoom(socket)
      if (!room) return
      room.postIts.push(postIt)
      io.to(socket.roomId).emit('postit-added', postIt)
    })

    socket.on('remove-postit', (postItId) => {
      const room = getRoom(socket)
      if (!room) return
      room.postIts = room.postIts.filter(p => p.id !== postItId)
      io.to(socket.roomId).emit('postit-removed', postItId)
    })

    socket.on('move-postit', ({ id, x, y }) => {
      const room = getRoom(socket)
      if (!room) return
      const postIt = room.postIts.find(p => p.id === id)
      if (postIt) {
        postIt.x = x
        postIt.y = y
        socket.to(socket.roomId).emit('postit-moved', { id, x, y })
      }
    })

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId)
        if (room) {
          room.users.delete(socket.id)
          io.to(socket.roomId).emit('user-left', {
            username: socket.username,
            users: Array.from(room.users.values()),
          })
          if (room.users.size === 0) {
            rooms.delete(socket.roomId)
            console.log(`🗑️ Room ${socket.roomId} deleted (empty)`)
          }
        }
      }
      console.log('❌ Disconnected:', socket.id)
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`🚀 Server ready on http://localhost:${PORT}`)
  })
})
