export class Track {
  constructor(type, id, artwork, title, creator, link) {
    this.type = type;
    this.id = id;
    this.artwork = artwork;
    this.title = title;
    this.creator = creator;
    this.link = link
  }
}

export class Song {
  constructor(id, name, liked, reposted, length) {
    this.id = id,
    this.name = name,
    this.liked = liked,
    this.reposted = reposted,
    this.length = length
  }
}