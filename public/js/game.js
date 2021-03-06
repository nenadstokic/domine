const config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'Arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let poredjaneDomine = [];
let domineIgraca = [];

function preload() {
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
  this.load.image('star', 'assets/star_gold.png');
  this.load.spritesheet('domine', 'assets/domine2240x158.png', {
    frameWidth: 80,
    frameHeight: 158
  });
}

function create() {
  //game.input.mouse.capture = true;
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', players => {
    console.log('curentPlayers event happened');

    Object.keys(players).forEach(id => {
      if (id === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', playerInfo => {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', playerId => {
    self.otherPlayers.getChildren().forEach(otherPlayer => {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on('playerMoved', playerInfo => {
    self.otherPlayers.getChildren().forEach(otherPlayer => {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.blueScoreText = this.add.text(16, 16, '', {
    fontSize: '32px',
    fill: '#0000FF',
    fontStyle: 'bold'
  });
  this.redScoreText = this.add.text(584, 16, '', {
    fontSize: '32px',
    fill: '#FF0000',
    fontStyle: 'bold'
  });
  this.socket.on('scoreUpdate', scores => {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });
  this.socket.on('starLocation', starLocation => {
    if (self.star) {
      self.star.destroy();
    }
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
    self.physics.add.overlap(
      self.ship,
      self.star,
      () => {
        this.socket.emit('starCollected');
      },
      null,
      self
    );
  });

  const oznakeDomina = [
    '00',
    '11',
    '01',
    '22',
    '12',
    '02',
    '33',
    '23',
    '13',
    '03',
    '44',
    '34',
    '24',
    '14',
    '04',
    '55',
    '45',
    '35',
    '25',
    '15',
    '05',
    '66',
    '56',
    '46',
    '36',
    '26',
    '16',
    '06'
  ];

  const sirinaDomine = 40;
  const visinaDomine = 79;

  // niz izmešanih brojeva od 0 do 27
  const slobodneDomine = randomUniqueNumbers(28);

  // različiti brojevi od 0 do 27 (indeks niza oznakeDomina)
  domineIgraca = podeliDomine(slobodneDomine, 22);
  const domineIgraca2 = podeliDomine(slobodneDomine, 1);
  poredjaneDomine = podeliDomine(slobodneDomine, 5);

  console.log(domineIgraca);
  console.log(poredjaneDomine);
  //console.log(slobodneDomine);

  grupaDomineIgraca = this.add.group();

  for (let i = 0; i < domineIgraca.length; i++) {
    let domina = this.physics.add
      .sprite(10 + i * 40, 550, 'domine', domineIgraca[i])
      .setInteractive();
    domina.setDisplaySize(sirinaDomine, visinaDomine);
    //domina.setAngle(90);
    this.input.setDraggable(domina);
    domina.status = defaultStatus(domineIgraca[i], oznakeDomina);
    domina.indeks = domineIgraca[i];

    grupaDomineIgraca.add(domina);
  }

  // for (let i = 0; i < domineIgraca2.length; i++) {
  //   let domina = this.physics.add
  //     .sprite(100 + i * 90, 200, 'domine', domineIgraca2[i])
  //     .setInteractive();
  //   domina.setDisplaySize(40, 79);
  //   //domina.setAngle(90);
  //   this.input.setDraggable(domina);
  //   domina.dominoValue = domineIgraca2[i];
  // }

  // stavljamo prvu dominu
  this.grupaPoredjaneDomine = this.add.group();

  //   let domina = this.physics.add
  //     .sprite(400, 250, 'domine', poredjaneDomine[0])
  //     .setInteractive();
  //   domina.setDisplaySize(40, 79);
  // domina.status = defaultStatus(poredjaneDomine[0], oznakeDomina);
  //   rotirajDominu(domina);
  //   this.grupaPoredjaneDomine.add(domina);

  for (let i = 0; i < poredjaneDomine.length; i++) {
    let domina = this.physics.add
      .sprite(100 + i * 130, 100 + i * 60, 'domine', poredjaneDomine[i])
      .setInteractive();
    domina.setDisplaySize(sirinaDomine, visinaDomine);
    domina.status = defaultStatus(poredjaneDomine[i], oznakeDomina);
    //initDomina(domina, sirinaDomine, visinaDomine, poredjaneDomine[i])
    //======================================
    rotirajDominu(domina);
    //======================================

    this.grupaPoredjaneDomine.add(domina);
  }

  // this.physics.add.overlap(domina, grupaDomineIgraca, spojDomine, null, this);
  this.physics.add.overlap(
    this.grupaPoredjaneDomine,
    grupaDomineIgraca,
    dodirDomina,
    null,
    this
  );

  this.input.on('dragstart', function(pointer, gameObject, dragX, dragY) {
    gameObject.startx = gameObject.x;
    gameObject.starty = gameObject.y;
    self.children.bringToTop(gameObject);
  });
  this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;
    gameObject.setTint(0xffffff);
  });

  this.input.on('dragend', function(pointer, gameObject) {
    console.log('status: ' + gameObject.status);
    console.log('start: ' + gameObject.startx + '.' + gameObject.starty);
    console.log('end: ' + gameObject.x + '.' + gameObject.y);
    // ako nije pomerana domina, rotiraj je
    if (
      gameObject.x === gameObject.startx &&
      gameObject.y === gameObject.starty
    ) {
      rotirajDominu(gameObject);
    }
  });
}

function update() {
  if (this.ship) {
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(150);
    } else {
      this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      // thrust
      this.physics.velocityFromRotation(
        this.ship.rotation + 1.5,
        200,
        this.ship.body.acceleration
      );
    } else if (this.cursors.down.isDown) {
      // brakes
      this.physics.velocityFromRotation(
        this.ship.rotation + 1.5,
        -200,
        this.ship.body.acceleration
      );
    } else {
      this.ship.setAcceleration(0);
    }
    this.physics.world.wrap(this.ship, 5);

    //emit player movement
    let x = this.ship.x;
    let y = this.ship.y;
    let r = this.ship.rotation;
    if (
      this.ship.oldPosition &&
      (x !== this.ship.oldPosition.x ||
        y !== this.ship.oldPosition.y ||
        r !== this.ship.oldPosition.rotation)
    ) {
      this.socket.emit('playerMovement', {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation
      });
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    };
  }
}

function defaultStatus(index, oznakeDomina) {
  let status = '----v';
  if (
    ['00', '11', '22', '33', '44', '55', '66'].includes(
      oznakeDomina[index].toString()
    )
  ) {
    status =
      oznakeDomina[index].toString() + oznakeDomina[index].toString() + 'v';
  } else {
    status =
      oznakeDomina[index][0].toString() +
      '-' +
      oznakeDomina[index][1].toString() +
      '-' +
      'v';
  }
  return status;
}

function rotirajDominu(domina) {
  console.log('domina status u fji: ' + domina.status);
  console.log(domina.status[2].toString());
  console.log(domina.status[3].toString());
  console.log(domina.status[1].toString());
  console.log(domina.status[0].toString());
  console.log(domina.status[4] === 'v' ? 'h' : 'v');
  let noviStatus = '';
  let orijentacija;
  if (domina.status[4] === 'v') {
    orijentacija = 'h';
    domina.body.setSize(158, 80); // OVO JE POTREBNO ZBOG KOLIZIJE KADA SE DOMINA ZAROTIRA ZA 90 STEPENI
  } else {
    orijentacija = 'v';
    domina.body.setSize(80, 158); // I KADA SE VRSTI U USPRAVAN POLOŽAJ
  }
  let ugao = domina.angle + 90;
  domina.setAngle(ugao);

  noviStatus =
    domina.status[3].toString() + domina.status.slice(0, 3) + orijentacija;

  console.log(noviStatus);

  domina.status = noviStatus;
  console.log(domina.angle);
}

function dodirDomina(poredjana, igraceva) {
  let selfie = this;
  // sa koje strane stavljamo dominu
  let postavljanje;
  let dx = igraceva.x - poredjana.x;
  let dy = igraceva.y - poredjana.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    dx > 0 ? (postavljanje = 'desno') : (postavljanje = 'levo');
  } else {
    dy > 0 ? (postavljanje = 'dole') : (postavljanje = 'gore');
  }
  // proveravamo statuse i pripajamo ako može
  let igo = igraceva.status[0]; // igraceva domina gore
  let ide = igraceva.status[1]; // desno
  let ido = igraceva.status[2]; // dole
  let ile = igraceva.status[3]; // levo
  let iori = igraceva.status[4]; // orijentacija
  let pgo = poredjana.status[0]; // poredjana domina gore
  let pde = poredjana.status[1]; // desno
  let pdo = poredjana.status[2]; // dole
  let ple = poredjana.status[3]; // levo
  let pori = poredjana.status[4]; // orijentacija

  // horizontalna postavljena i igračeva vertikalna
  if (pori === 'h' && iori === 'v') {
    if (postavljanje === 'desno') {
      dx = 59;
      if (pde === ido && pde === igo) {
        dy = 0;
        fiksiraj(dx, dy, 1, 3);
      }
      if (pde === ido && pde !== igo) {
        dy = -20;
        fiksiraj(dx, dy, 1, 2);
      }
      if (pde === igo && pde !== ido) {
        dy = 20;
        fiksiraj(dx, dy, 1, 0);
      }
    }
    if (postavljanje === 'levo') {
      dx = -59;
      if (ple === ido && ple === igo) {
        dy = 0;
        fiksiraj(dx, dy, 3, 1);
      }
      if (ple === igo && ple !== ido) {
        dy = 20;
        fiksiraj(dx, dy, 3, 0);
      }
      if (ple === ido && ple !== igo) {
        dy = -20;
        fiksiraj(dx, dy, 3, 2);
      }
    }
    if (postavljanje === 'gore') {
      dx = 0;
      if (pgo !== '-' && ple === ido && pde === ido) {
        dy = -59;
        fiksiraj(dx, dy, 0, 2);
      }
    }
    if (postavljanje === 'dole') {
      dx = 0;
      if (pdo !== '-' && pde === igo && ple === igo) {
        dy = 59;
        fiksiraj(dx, dy, 2, 0);
      }
    }
  }
  // horizontalna postavljena i igračeva
  if (pori === 'h' && iori === 'h') {
    dy = 0;
    if (postavljanje === 'desno') {
      if (pde === ile) {
        dx = 78;
        fiksiraj(dx, dy, 1, 3);
      }
    }
    if (postavljanje === 'levo') {
      if (ple === ide) {
        dx = -78;
        fiksiraj(dx, dy, 3, 1);
      }
    }
  }

  function fiksiraj(dex, dey, pstatus, istatus) {
    igraceva.x = poredjana.x + dex;
    igraceva.y = poredjana.y + dey;
    let pointer = selfie.input.activePointer;

    if (pointer.isDown) {
      igraceva.setTint(0xaaffaa);
    } else {
      dodatniPomerajx = Math.abs(dex) > Math.abs(dey) ? Math.sign(dex) * 2 : 0;
      dodatniPomerajy = Math.abs(dex) < Math.abs(dey) ? Math.sign(dey) * 2 : 0;
      igraceva.x = poredjana.x + dex + dodatniPomerajx;
      igraceva.y = poredjana.y + dey + dodatniPomerajy;
      poredjana.status = poredjana.status.replaceAt(pstatus, '-');
      igraceva.status = igraceva.status.replaceAt(istatus, '-');
      postaviDominuNaSto(igraceva, domineIgraca, selfie.grupaPoredjaneDomine);
      console.log('status igraceve nakon fiksiranja: ' + igraceva.status);
      console.log('status postavljene nakon fiksiranja: ' + poredjana.status);
    }
  }

  /*
  if (postavljanje === 'dole' && pdo === igo) {
    //
    console.log('MOŽE!');
    if (pori === 'h' && iori === 'v') {
      // pripajamo vertikalnu dominu odozdo na horizontalnu dominu
      igraceva.x = poredjana.x;
      igraceva.y = poredjana.y + 59;
      let pointer = this.input.activePointer;
      //ako ne držimo dugme miša, domina će se fiksirati na mesto
      if (pointer.isDown) {
      } else {
        // pointer.isUp
        igraceva.y = poredjana.y + 61;
        igraceva.status = igraceva.status.replaceAt(0, '-');
        poredjana.status = poredjana.status.replaceAt(2, '-');
        postaviDominuNaSto(igraceva, domineIgraca, this.grupaPoredjaneDomine);
      }
    }
    if (pori === 'v' && iori === 'v') {
      // pripajamo vertikalnu dominu odozdo na vertikalnu dominu
      igraceva.x = poredjana.x;
      igraceva.y = poredjana.y + 78;
      let pointer = this.input.activePointer;
      //ako ne držimo dugme miša, domina će se fiksirati na mesto
      if (pointer.isDown) {
      } else {
        // pointer.isUp
        igraceva.y = poredjana.y + 80;
        igraceva.status = igraceva.status.replaceAt(0, '-');
        poredjana.status = poredjana.status.replaceAt(2, '-');
        postaviDominuNaSto(igraceva, domineIgraca, this.grupaPoredjaneDomine);
      }
    }
    if (pori === 'v' && iori === 'h') {
      // pripajamo horizontalnu dominu odozdo na vertikalnu dominu
      igraceva.x = poredjana.x;
      igraceva.y = poredjana.y + 59;
      let pointer = this.input.activePointer;
      //ako ne držimo dugme miša, domina će se fiksirati na mesto
      if (pointer.isDown) {
      } else {
        // pointer.isUp
        igraceva.y = poredjana.y + 61;
        igraceva.status = igraceva.status.replaceAt(0, '-');
        poredjana.status = poredjana.status.replaceAt(2, '-');
        postaviDominuNaSto(igraceva, domineIgraca, this.grupaPoredjaneDomine);
      }
    }
  }

  if (postavljanje === 'desno' && pde === ile) {
    console.log('MOŽE!');
    if (pori === 'h' && iori === 'v') {
      // pripajamo uspravnu dominu s desne strane horizontalne domine
      igraceva.x = poredjana.x + 59;
      igraceva.y = poredjana.y;
      let pointer = this.input.activePointer;
      //ako ne držimo dugme miša, domina će se fiksirati na mesto
      if (pointer.isDown) {
      } else {
        // pointer.isUp
        igraceva.x = poredjana.x + 61;
        igraceva.status = igraceva.status.replaceAt(3, '-');
        poredjana.status = poredjana.status.replaceAt(1, '-');
        postaviDominuNaSto(igraceva, domineIgraca, this.grupaPoredjaneDomine);
      }
    }
    if (pori === 'v' && iori === 'h') {
      console.log('drugi slucaj');
      // pripajamo horizontalnu dominu s desne strane uspravne domine
      igraceva.x = poredjana.x + 59;
      igraceva.y = poredjana.y;
      let pointer = this.input.activePointer;
      //ako ne držimo dugme miša, domina će se fiksirati na mesto
      if (pointer.isDown) {
      } else {
        // pointer.isUp
        igraceva.x = poredjana.x + 61;
        igraceva.status = igraceva.status.replaceAt(3, '-');
        poredjana.status = poredjana.status.replaceAt(1, '-');
        postaviDominuNaSto(igraceva, domineIgraca, this.grupaPoredjaneDomine);
      }
    }
    if (pori === 'h' && iori === 'h') {
      console.log('treci slucaj');
      // pripajamo horizontalnu dominu s desne strane horizontalne domine
      igraceva.x = poredjana.x + 78;
      igraceva.y = poredjana.y;
      let pointer = this.input.activePointer;
      //ako ne držimo dugme miša, domina će se fiksirati na mesto
      if (pointer.isDown) {
      } else {
        // pointer.isUp
        igraceva.x = poredjana.x + 80;
        igraceva.status = igraceva.status.replaceAt(3, '-');
        poredjana.status = poredjana.status.replaceAt(1, '-');
        postaviDominuNaSto(igraceva, domineIgraca, this.grupaPoredjaneDomine);
      }
    }
  }
  */
}

String.prototype.replaceAt = function(index, replacement) {
  if (index >= this.length) {
    return this.valueOf();
  }
  return this.substring(0, index) + replacement + this.substring(index + 1);
};

function postaviDominuNaSto(domina, nizDomineIgraca, grupa) {
  domina.setTint(0xffffff);
  // ne može više da se pomera
  domina.disableInteractive();
  // broj domine se prebacuje sa igrača na domine na stolu
  poredjaneDomine.push(domina.indeks);
  nizDomineIgraca.splice(nizDomineIgraca.indexOf(domina.indeks), 1);
  // i dodaje u grupu sprajtova domina na stolu
  grupa.add(domina);
  console.log(poredjaneDomine);
  console.log(nizDomineIgraca);
}

function randomUniqueNumbers(numberOfElements) {
  const array = [];
  for (let i = 0; i < numberOfElements; i++) {
    array.push(i);
  }
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function podeliDomine(slobodneDomine, brojDomina) {
  const domine = [];
  for (let i = 0; i < brojDomina; i++) {
    domine.push(slobodneDomine.pop());
  }
  return domine;
}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add
    .image(playerInfo.x, playerInfo.y, 'ship')
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.setMaxVelocity(200);
  console.log('added ' + playerInfo.team + ' ' + playerInfo.playerId);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add
    .sprite(playerInfo.x, playerInfo.y, 'otherPlayer')
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}
