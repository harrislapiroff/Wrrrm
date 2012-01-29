TESTING = false

Crafty.scene "loading", () ->
	title_text = Crafty.e "2D, DOM, Text, Persist"
	title_text.attr w: Crafty.viewport.width, h: 128, x: 0, y: 40
	title_text.text GAME_TITLE
	title_text.css "text-align": "center", "color": "#000", "font-family": "Medula One", "font-size": 128, "text-transform": "uppercase"
	
	loading_text = Crafty.e "2D, DOM, Text"
	loading_text.attr w: Crafty.viewport.width, h: 20, x: 0, y: (Crafty.viewport.width - 20) / 2
	loading_text.text "Loading..."
	loading_text.css "text-align": "center", "color": "#000"
	
	Crafty.load ["img/person.png", "img/noise.png","img/spike.png"], () ->
		Crafty.scene("Setup")

Crafty.scene "Setup", () ->
	snake = generate_snake WORLD_RADIUS
	protagonist = generate_protagonist snake
	snakehead = generate_snakehead snake, 125
	death_floor = generate_death x: -1000, y: Crafty.viewport.height + 30, w: Crafty.viewport.width + 2000, h: 1
	platform = generate_platform snake, 800, {w: 100, h: 3}, 80
	platform_2 = generate_platform snake, 900, {w: 100, h: 3}, 120
	snake.addComponent "Persist"
	protagonist.addComponent "Persist"
	snakehead.addComponent "Persist"
	death_floor.addComponent "Persist"
	protagonist.setSurfaceLocation -100
	
	KeyDownHandler = () ->
		# unbind the keypress
		Crafty.unbind "KeyDown", KeyDownHandler
		# triggers the world to start spinning
		snake.startSpin -.25
		# make man mortal
		protagonist.mortality()
		# go to scene 1
		Crafty.scene "Scene 1"

	Crafty.bind "KeyDown", KeyDownHandler

Crafty.scene "Scene 1", () ->
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	
	i = 100
	while (i + 900) < WORLD_CIRCUMFERENCE
		i = Crafty.math.randomInt i+300, i + 900
		generate_spike snake, i
	
	protagonist.bind "Died", () ->
		protagonist.immortality()
		# rotate back to start
		snake.rotateTo 0
		# Make man mortal.
		protagonist.mortality()
		# Move protagonist
		protagonist.setSurfaceLocation -100
		# back to scene 1
		Crafty.scene "Scene 1"