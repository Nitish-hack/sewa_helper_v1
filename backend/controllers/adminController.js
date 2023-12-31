const { Admin, validate } = require("../models/adminModel");
const bcrypt = require("bcrypt");
const Joi = require("joi");

module.exports.register=async (req, res) => {   // register 
	try {
		const { error } = validate(req.body);
		if (error)  
			return res.status(400).send({ message: error.details[0].message });

		const admin = await Admin.findOne({ email: req.body.email });
		if (admin)
			return res
				.status(409)
				.send({ message: "User with given email already Exist!" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		await new Admin({ ...req.body, password: hashPassword }).save();
		res.status(201).send({ message: "Admin created successfully, but require acess to manipulate data" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
}


module.exports.login= async (req, res) => {
	try {
		const { error } = validateLogin(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		const admin = await Admin.findOne({ email: req.body.email });
		if (!admin)
			return res.status(401).send({ message: "Invalid Email or Password" });

		const validPassword = await bcrypt.compare(
			req.body.password,
			admin.password
		);
		if (!validPassword)
			return res.status(401).send({ message: "Invalid Email or Password" });

		const token = admin.generateAuthToken();
		res.status(200).send({ user:admin, data: token, message: "logged in successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
};

const validateLogin = (data) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(data);
};
