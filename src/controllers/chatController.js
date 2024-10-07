const { runQuery } = require("../config/db");

exports.createRoom = async (req, res) => {
  try {
    const { name, isGroup, participants } = req.body; // Room name (optional) and participants
    console.log("req.body: ", req.body);

    const query = `
        INSERT INTO public.rooms (name, "is_group") 
        VALUES ($1, $2) 
        RETURNING *`;

    const queryParams = [name || null, isGroup];

    const newRoom = await runQuery(query, queryParams);

    // Insert participants into the room
    const roomId = newRoom[0].id;

    const participantQueries = participants.map((participantId) => {
      const participantQuery = `
          INSERT INTO public.room_participants (room_id, user_id) 
          VALUES ($1, $2) 
          RETURNING *`;
      return runQuery(participantQuery, [roomId, participantId]);
    });

    await Promise.all(participantQueries);

    res.status(201).json(newRoom[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, senderId, message } = req.body;

    const query = `
        INSERT INTO public.messages (room_id, sender_id, message) 
        VALUES ($1, $2, $3) 
        RETURNING *`;

    const queryParams = [roomId, senderId, message];

    const newMessage = await runQuery(query, queryParams);

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getChatList = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("userId: ", userId);

    const query = `
        SELECT rooms.*, messages.message AS last_message, messages.created_at AS last_message_time 
        FROM public.rooms
        JOIN public.room_participants ON room_participants.room_id = rooms.id
        LEFT JOIN public.messages ON messages.room_id = rooms.id
        ORDER BY messages.created_at DESC`;

    // WHERE room_participants.user_id = $1
    // const chatList = await runQuery(query, [userId]);

    const chatList = await runQuery(query);
    console.log("chatList: ", chatList);

    res.status(200).json(chatList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getMessagesForRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const query = `
        SELECT * 
        FROM public.messages 
        WHERE room_id = $1 
        ORDER BY created_at ASC`;

    const messages = await runQuery(query, [roomId]);

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
