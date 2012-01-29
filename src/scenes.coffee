SNAKEHEAD_ORIGIN = 500
PLAYER_ORIGIN = -100

Crafty.scene "loading", () ->
	title_text = Crafty.e "2D, DOM, Text, Tween, Persist, Title"
	title_text.attr w: Crafty.viewport.width, h: 128, x: 0, y: 40
	title_text.text GAME_TITLE
	title_text.css "text-align": "center", "color": "#000", "font-family": "Medula One", "font-size": 128, "text-transform": "uppercase"
	
	loading_text = Crafty.e "2D, DOM, Text"
	loading_text.attr w: Crafty.viewport.width, h: 20, x: 0, y: (Crafty.viewport.width - 20) / 2
	loading_text.text "Loading..."
	loading_text.css "text-align": "center", "color": "#000"
	
	Crafty.load ["img/person.png", "img/noise.png","img/spike.png"], () ->
		# start the game!
		Crafty.scene("Setup")


Crafty.scene "Setup", () ->
	title_text = Crafty(Crafty("Title")[0])
	snake = generate_snake WORLD_RADIUS
	protagonist = generate_protagonist snake
	snakehead = generate_snakehead snake, SNAKEHEAD_ORIGIN
	death_floor = generate_death x: -1000, y: Crafty.viewport.height + 200, w: Crafty.viewport.width + 2000, h: 1
	platform = generate_platform snake, 800, 80
	platform_2 = generate_platform snake, 900, 120
	snake.addComponent "Persist"
	protagonist.addComponent "Persist"
	snakehead.addComponent "Persist"
	death_floor.addComponent "Persist"
	protagonist.setSurfaceLocation PLAYER_ORIGIN
	
	protagonist.bind "Died", () ->
		# temporary immortality, just in case
		protagonist.immortality()
		# stop the world spinning
		snake.stopSpin()
		# rotate world back to start
		snake.rotateTo 0
		# Make man mortal.
		protagonist.mortality()
		# Move protagonist back to origin
		protagonist.setSurfaceLocation PLAYER_ORIGIN
		# restart current scene (calling a private attribute? Bad bad!)
		Crafty.scene Crafty._current
	
	MovedHandler = () ->
		# unbind the keypress
		protagonist.unbind "Moved", MovedHandler
		# fade out title text
		title_text.tween {alpha: 0}, 100
		# make man mortal
		protagonist.mortality()
		# go to scene 1
		level = get_query_variable("level")
		if level
			Crafty.scene "Scene #{level}"
		else
			Crafty.scene "Scene 1"
	
	protagonist.bind "Moved", MovedHandler

Crafty.scene "Scene 1", () ->
	# Gray
	# a basic level that gradually speeds up and has a couple platforms, basically a tutorial
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(0, 0, 80)
	
	# gradually ramp up speed
	snake.delay (() -> @startSpin -.05), 2000
	snake.delay (() -> @startSpin -.1), 4000
	snake.delay (() -> @startSpin -.15), 6000
	snake.delay (() -> @startSpin -.2), 8000
	snake.delay (() -> @startSpin -.25), 10000
	snake.delay (() -> @startSpin -.3), 12000
	snake.delay (() -> @startSpin -.35), 14000

	for i in [900, 1800, 2400, 2450, 2500]
		generate_spike snake, i
	
	generate_platform snake, 3000, 40
	generate_platform snake, 3250, 80
	generate_platform snake, 3500, 120
	generate_platform snake, 3750, 160

	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 2"

Crafty.scene "Scene 2", () ->
	# Yellow
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(60, 70, 50)
	snake.startSpin -.35
	
	for i in [900, 1300, 1700, 2100, 2150, 2200, 2600, 3000, 3400, 3800, 3850, 3900, 4300, 4700, 5100, 5500]
		generate_spike snake, i
	
	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 3"

Crafty.scene "Scene 3", () ->
	# Denim Blue
	# a level with some spikes in the middle that are too close together to jump over, so you must use the clouds
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(190, 20, 30)
	snake.startSpin -.25
	
	for i in [900, 950, 1000, 1050, 1100, 1800, 1850, 1900, 1950, 2000, 2050, 2100, 2150, 4700, 5100, 5500]
		generate_spike snake, i
	
	generate_platform snake, 2000, 50
	generate_platform snake, 2300, 80

	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 4"


Crafty.scene "Scene 4", () ->
	# Red
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(0, 90, 30)
	snake.startSpin -.5
	
	for i in [900, 1300, 1700, 2100, 2150, 2200, 2600, 3000, 3400, 3800, 3850, 3900, 4300, 4700, 5100, 5500]
		generate_spike snake, i
	
	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 5"

Crafty.scene "Scene 5", () ->
	# Violet
	# A straight up fast level with no enemies. Just don't fall off the back.
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(340, 80, 20)
	snake.startSpin -.62

	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 6"
		
Crafty.scene "Scene 6", () ->
	# Peach
	# Still slightly faster than you can run, but with spikes.
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(25, 90, 60)
	snake.startSpin -.1
	snake.delay (() -> @startSpin -.2), 200
	snake.delay (() -> @startSpin -.3), 400
	snake.delay (() -> @startSpin -.45), 600
	snake.delay (() -> @startSpin -.6), 1000

	for i in [825, 850, 900, 1500, 1600, 2200, 2250, 2300, 2600, 3800, 3850, 3900, 4300, 4700, 5100, 5500]
		generate_spike snake, i

	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 7"

Crafty.scene "Scene 7", () ->
	# Pale Green
	# You have to jump on clouds to survive
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(100, 30, 60)
	snake.startSpin -.4

	generate_platform snake, 800, 40
	generate_platform snake, 1000, 80
	generate_platform snake, 1200, 120
	generate_platform snake, 1400, 160
	generate_platform snake, 1600, 200
	generate_platform snake, 1800, 240
	generate_platform snake, 2000, 240
	generate_platform snake, 2200, 300

	for i in [825, 850, 900, 1500, 1600, 2200, 2250, 2300, 2350, 2400, 2450, 2500, 2550, 2600, 3800, 3850, 3900, 4300, 4700, 5100, 5500]
		generate_spike snake, i

	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 8"

Crafty.scene "Scene 8", () ->
	# Peach
	# Still slightly faster than you can run, but with spikes.
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(25, 90, 60)
	snake.delay (() -> @startSpin -.4), 200
	snake.delay (() -> @startSpin -.2), 400
	snake.delay (() -> @stopSpin), 600
	snake.delay (() -> @startSpin .4), 1000

	# Pale Green
	# You have to jump on clouds to survive
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	color_shift(100, 30, 60)
	snake.startSpin -.4

	generate_platform snake, 800, 40
	generate_platform snake, 1000, 80
	generate_platform snake, 1200, 120
	generate_platform snake, 1400, 160
	generate_platform snake, 1600, 200
	generate_platform snake, 1800, 240
	generate_platform snake, 2000, 240
	generate_platform snake, 2200, 300
	generate_platform snake, 2600, 200
	generate_platform snake, 3000, 240
	generate_platform snake, 3250, 180
	generate_platform snake, 3500, 180
	generate_platform snake, 3800, 60
	generate_platform snake, 4000, 60

	for i in [825, 850, 900, 1500, 1600, 2200, 2250, 2300, 2350, 2400, 2450, 2500, 2550, 2600, 3800, 3850, 3900, 4300, 4700, 5100, 5500]
		generate_spike snake, i
	
	snake.bind "CompleteRotation", () ->
		Crafty.scene "Scene 100"

Crafty.scene "Scene 100", () ->
	snake = Crafty(Crafty("Snake")[0])
	protagonist = Crafty(Crafty("Protagonist")[0])
	protagonist.immortality()
	snake.startSpin -.6
	color_shift(255, 255, 255)
	title_text = Crafty(Crafty("Title")[0])
	
	# slow down to a stop
	snake.delay (() -> @startSpin -.4), 2000
	snake.delay (() -> @startSpin -.2), 2500
	snake.delay (() -> @startSpin -.1), 3000
	snake.delay (() -> @stopSpin()), 4500
	
	# fade everything out
	objects = Crafty("2D Tween")
	for object in objects
		Crafty(object).delay (() -> @tween {alpha: 0}, 100), 3000
	
	#bring back the title text
	title_text.text "FIN"
	title_text.delay (() -> @tween {alpha: 1}, 50), 4000
	
	credit_text = Crafty.e "2D, DOM, Text, Tween, Persist, Title"
	credit_text.attr w: Crafty.viewport.width, h: 256, x: 0, y: 160, alpha:0
	credit_text.text "Design & Code: Harris Lapiroff<br />Music: Jarryd Huntley<br />Character: Amanda Lozada"
	credit_text.css "text-align": "center", "color": "#000", "font-family": "Medula One", "font-size": 64, "text-transform": "uppercase"
	credit_text.delay (() -> @tween {alpha: 1}, 50), 5000

	# not sure why this restart code isn't working. get it later
	#destroy_all = () ->
	#	objects = Crafty('2D')
	#	for object in objects
	#		Crafty(object).removeComponent("Persist")
	#		Crafty(object).destroy()
	#		Crafty.scene "loading"
	#		
	#setTimeout destroy_all, 8000