const axios = require("axios");
const db = require("../database/dbConfig");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secrets = require("./secrets");

const { authenticate } = require("../auth/authenticate");

module.exports = server => {
	server.post("/api/register", register);
	server.post("/api/login", login);
	server.get("/api/jokes", authenticate, getJokes);
};

async function register(req, res) {
	// implement user registration
	try {
		const checkUser = await db("users")
			.where({ username: req.body.username })
			.first();
		if (!req.body.username || !req.body.password) {
			res.status(400).json({
				message: "please provide username and password."
			});
		} else if (checkUser && req.body.username === checkUser.username) {
			res.status(401).json({
				message: "username is already in use, please provide another"
			});
		} else {
			const hash = bcrypt.hashSync(req.body.password, 10);
			req.body.password = hash;
			const userID = await db("users").insert(req.body);
			const user = await db("users")
				.select("id", "username")
				.where({ id: parseInt(userID) })
				.first();
			res.status(201).json(user);
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "something went wrong." });
	}
}

async function login(req, res) {
	// implement user login
	try {
		if (!req.body.username || !req.body.password) {
			res
				.status(400)
				.json({ message: "please provide username and password." });
		}
		let { username, password } = req.body;
		const user = await db("users")
			.where({ username })
			.first();
		if (user && bcrypt.compareSync(password, user.password)) {
			const token = generateToken(user);
			res.status(200).json({ message: `Welcome ${user.username}!`, token });
		} else {
			res.status(401).json({ message: "Invalid Credentials" });
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "something went wrong." });
	}
}

function generateToken(user) {
	const jwtPayload = {
		subject: user.id,
		username: user.username
	};

	const jwtOptions = {
		expiresIn: "1d"
	};

	return jwt.sign(jwtPayload, secrets.jwtSecret, jwtOptions);
}

function getJokes(req, res) {
	const requestOptions = {
		headers: { accept: "application/json" }
	};

	axios
		.get("https://icanhazdadjoke.com/search", requestOptions)
		.then(response => {
			res.status(200).json(response.data.results);
		})
		.catch(err => {
			res.status(500).json({ message: "Error Fetching Jokes", error: err });
		});
}
