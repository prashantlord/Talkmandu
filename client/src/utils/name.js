const FIRST_NAMES = [
    "Aarav",
    "Anika",
    "Arjun",
    "Asha",
    "Diya",
    "Kabir",
    "Kiran",
    "Lina",
    "Maya",
    "Nico",
    "Nora",
    "Ravi",
    "Sana",
    "Tara",
    "Zara",
];

const LAST_NAMES = [
    "Adhikari",
    "Bista",
    "Chaudhary",
    "Das",
    "Gurung",
    "Joshi",
    "Kapoor",
    "Lama",
    "Mehta",
    "Nayak",
    "Pandey",
    "Rana",
    "Sharma",
    "Thapa",
    "Verma",
];

const getRandomItem = (list) => list[Math.floor(Math.random() * list.length)];

export const generateDisplayName = () => `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`;

export const getDisplayName = () => {
    let name = localStorage.getItem("talkmandu_name");
    if (!name) {
        name = generateDisplayName();
        localStorage.setItem("talkmandu_name", name);
    }
    return name;
};
