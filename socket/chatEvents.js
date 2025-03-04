export const handleChatEvents = (io, socket) => {
  // 加入聊天室
  socket.on('join_room', (roomId) => {
    socket.join(roomId)
    console.log(`使用者 ${socket.id} 加入房間 ${roomId}`)
  })

  // 發送訊息
  socket.on('send_message', (data) => {
    console.log('send_message:', data)

    io.to(data.roomId).emit('receive_message', {
      // 修正拼寫錯誤
      ...data,
      create_at: new Date(),
    })
  })

  // 離開聊天室
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId)
    console.log(`使用者 ${socket.id} 離開房間 ${roomId}`)
  })
}
