export class Track {
  constructor(id, artwork, title, creator) {
    this.id = id;
    this.artwork = artwork;
    this.title = title;
    this.creator = creator;
  }

  greet() {
    console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);
  }
}