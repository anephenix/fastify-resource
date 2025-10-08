export type Possession = {
	name: string;
};

export type Child = {
	firstName: string;
	possessions: Possession[];
};

export type SeedData = {
	firstName: string;
	children: Child[];
	possessions: Possession[];
};

const seedData: SeedData = {
	firstName: "Sylvester",
	children: [
		{
			firstName: "Sage",
			possessions: [
				{
					name: "Bike",
				},
			],
		},
		{
			firstName: "Sophia",
			possessions: [
				{
					name: "Skateboard",
				},
			],
		},
	],
	possessions: [
		{
			name: "Car",
		},
	],
};

export default seedData;
