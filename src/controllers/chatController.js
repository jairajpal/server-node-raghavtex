const { runQuery } = require("../config/db");

exports.createRoom = async (req, res) => {
  try {
    const { name, isGroup, participants } = req.body; // Room name (optional) and participants
    const currentUserId = req.user.id; // Assuming req.user.id is the current user ID
    console.log("currentUserId: ", currentUserId);

    // Ensure participants array exists and has at least one participant
    if (!Array.isArray(participants) || participants.length === 0) {
      return res
        .status(400)
        .json({ error: "Participants list cannot be empty." });
    }

    // Check for duplicates in the participants list
    const uniqueParticipants = [...new Set(participants)];
    if (uniqueParticipants.length !== participants.length) {
      return res
        .status(400)
        .json({ error: "Duplicate participants are not allowed." });
    }

    // If it's not a group chat, enforce two participants (including the current user)
    if (!isGroup) {
      if (uniqueParticipants.length !== 1) {
        return res.status(400).json({
          error:
            "For private chats, there must be exactly one other participant.",
        });
      }

      // Ensure the current user is not trying to chat with themselves
      if (uniqueParticipants.includes(currentUserId)) {
        return res.status(400).json({
          error:
            "You cannot create a room with yourself as the only participant.",
        });
      }
    }
    uniqueParticipants.push(currentUserId);

    // Proceed with room creation
    const query = `
      INSERT INTO public.rooms (name, "is_group") 
      VALUES ($1, $2) 
      RETURNING *`;

    const queryParams = [name || null, isGroup];

    const newRoom = await runQuery(query, queryParams);

    // Insert participants into the room
    const roomId = newRoom[0].id;

    console.log("uniqueParticipants: ", uniqueParticipants);
    const participantQueries = uniqueParticipants.map((participantId) => {
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
    const { roomId, message } = req.body;
    const senderId = req.user.id;

    // 1. Ensure all required fields are provided
    if (!roomId || !senderId || !message) {
      return res
        .status(400)
        .json({ error: "roomId, senderId, and message are required." });
    }

    // 2. Check if the message is valid (non-empty, not just whitespace)
    if (typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    // 3. Check if the room exists
    const roomQuery = `SELECT * FROM public.rooms WHERE id = $1`;
    const roomExists = await runQuery(roomQuery, [roomId]);
    if (roomExists.length === 0) {
      return res.status(404).json({ error: "Room not found." });
    }

    // 4. Check if the sender is a participant in the room
    const participantQuery = `
      SELECT * FROM public.room_participants 
      WHERE room_id = $1 AND user_id = $2`;
    const isParticipant = await runQuery(participantQuery, [roomId, senderId]);
    if (isParticipant.length === 0) {
      return res
        .status(403)
        .json({ error: "Sender is not a participant in this room." });
    }

    // 5. Insert the message into the database
    const insertMessageQuery = `
      INSERT INTO public.messages (room_id, sender_id, message) 
      VALUES ($1, $2, $3) 
      RETURNING *`;

    const queryParams = [roomId, senderId, message];

    const newMessage = await runQuery(insertMessageQuery, queryParams);

    // 6. Respond with the new message data
    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getChatList = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Check if userId is provided
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    // 2. Check if the user exists in the database
    const userQuery = `SELECT id, username FROM public.auth_user WHERE id = $1`;
    const userExists = await runQuery(userQuery, [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    // 3. Get the chat list with the last message and usernames of participants
    const query = `
      SELECT 
        rooms.id,
        rooms.name,
        rooms.is_group,
        last_messages.last_message, 
        last_messages.last_message_time,
        -- For group rooms, aggregate all participants' usernames
        -- For one-on-one rooms, exclude the current user's username
        CASE 
          WHEN rooms.is_group = true THEN array_agg(auth_user.username) 
          ELSE array_agg(auth_user.username) FILTER (WHERE auth_user.id != $1) 
        END AS participants_usernames
      FROM public.rooms
      JOIN public.room_participants ON room_participants.room_id = rooms.id
      JOIN public.auth_user ON auth_user.id = room_participants.user_id
      -- Subquery to get the latest message for each room
      LEFT JOIN (
        SELECT room_id, message AS last_message, created_at AS last_message_time
        FROM public.messages
        WHERE (room_id, created_at) IN (
          SELECT room_id, MAX(created_at)
          FROM public.messages
          GROUP BY room_id
        )
      ) AS last_messages ON last_messages.room_id = rooms.id
      WHERE rooms.id IN (
        SELECT room_id FROM public.room_participants WHERE user_id = $1
      )
      GROUP BY rooms.id, last_messages.last_message, last_messages.last_message_time
      ORDER BY last_messages.last_message_time DESC NULLS LAST`;

    const chatList = await runQuery(query, [userId]);
    console.log("chatList: ", chatList);

    res.status(200).json(chatList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMessagesForRoom = async (req, res) => {
  try {
    const { roomId, userId } = req.params; // userId is optional in params
    const senderId = req.user.id; // Assuming userId is coming from authentication middleware

    // 1. Check if roomId is provided
    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required." });
    }

    // 2. Check if the room exists
    let roomQuery = `SELECT * FROM public.rooms WHERE id = $1`;
    let roomExists = await runQuery(roomQuery, [roomId]);

    // 3. If room does not exist and userId is provided, create a new room for userId and senderId
    if (roomExists.length === 0 && userId) {
      console.log(
        "Room not found, creating a new room for userId and senderId"
      );

      // Create a new room
      const createRoomQuery = `
        INSERT INTO public.rooms (name, "is_group") 
        VALUES (NULL, false) 
        RETURNING *`;

      const newRoom = await runQuery(createRoomQuery, []);
      const newRoomId = newRoom[0].id;

      // Add both senderId and userId as participants in the room
      const participantQueries = [
        `INSERT INTO public.room_participants (room_id, user_id) VALUES ($1, $2)`,
        `INSERT INTO public.room_participants (room_id, user_id) VALUES ($1, $2)`,
      ];

      await Promise.all([
        runQuery(participantQueries[0], [newRoomId, senderId]),
        runQuery(participantQueries[1], [newRoomId, userId]),
      ]);

      // Set the newRoomId to the roomExists variable for further message retrieval
      roomExists = newRoom;
    }

    // 4. Check if the user is a participant in the room
    const participantQuery = `
      SELECT * FROM public.room_participants 
      WHERE room_id = $1 AND user_id = $2`;
    const isParticipant = await runQuery(participantQuery, [
      roomExists[0].id,
      senderId,
    ]);
    if (isParticipant.length === 0) {
      return res
        .status(403)
        .json({ error: "You are not a participant in this room." });
    }

    // 5. Fetch messages for the room
    const query = `
      SELECT 
        messages.id,
        messages.room_id,
        messages.sender_id,
        messages.message,
        messages.created_at,
        auth_user.username AS sender_username
      FROM public.messages
      JOIN public.auth_user ON auth_user.id = messages.sender_id
      WHERE messages.room_id = $1
      ORDER BY messages.created_at DESC;
    `;

    const messages = await runQuery(query, [roomExists[0].id]);

    // 6. Handle case where no messages exist
    if (messages.length === 0) {
      return res.status(200).json([]);
    }

    // 7. Return the messages
    console.log("messages: ", messages);
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
