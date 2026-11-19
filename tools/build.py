"""Generates index.html for the portfolio from the project data below.

Edit THESIS, PROJECTS and EXPERIENCE, then run:  python tools/build.py
"""
from html import escape as e

M = "assets/media"

def img(path, alt): return dict(type="image", src=f"{M}/{path}.webp", thumb=f"{M}/{path}.webp", alt=alt)
def vid(path, alt): return dict(type="video", src=f"{M}/{path}.mp4", thumb=f"{M}/{path}.jpg", poster=f"{M}/{path}.jpg", alt=alt)

THESIS = dict(
    id="thesis",
    title="Autonomous vineyard mowing: LiDAR perception and trajectory generation",
    desc="Perception, mapping and planning that let a ground robot mow between vine rows using a single 3D LiDAR.",
    context="MSc thesis, FEUP and INESC TEC", year="2026", stack="C++, ROS 2, Webots",
    thumb=f"{M}/thesis/diag_8_rosbag_site1.webp",
    writeup=[
        "Grass between vine rows is mown several times a season, and the mower is narrower than the corridor, so full coverage takes two passes. On each pass the robot has to find the vine rows, remember what is already cut and keep its path at the right distance from the boundary between mown and unmown grass.",
        "The stack has three parts. Row detection fits vertical planes to each side of the corridor with RANSAC, in a near and a far region of interest that are re-placed on every sweep from the previous fit, so it follows curved rows without a curvature model. A vegetation height map is built inside the corridor polygon. A cut-line detector runs a cascade of geometric tests and only reports the mown-to-unmown boundary when the evidence is strong enough. The planner turns rows and boundary into a continuous path of chained cubic Bézier curves.",
        "I evaluated it in 20 Webots worlds covering five corridor shapes and four task types, and replayed a recording from a real vineyard in the Douro to check timing and the cut-line detector. A paper based on this work, “LiDAR-Only Dual-ROI Row Perception and Trajectory Generation for Autonomous Inter-Row Vineyard Mowing”, was accepted at ROBOT 2026 in Barcelona.",
    ],
    specs=[
        ("Sensing", "One 3D LiDAR, no row maps or GNSS row positions"),
        ("Software", "C++, ROS 2"),
        ("Simulation", "20 Webots worlds, 5 corridor shapes"),
        ("Field data", "Recording from a vineyard in the Douro"),
        ("Row-line error", "Below 0.10 m lateral RMSE (nominal corridors)"),
        ("Path error", "Within 0.10 m RMSE of the ideal path"),
        ("Perception time", "Under 23 ms per sweep on real data"),
        ("Grade", "19/20"),
        ("Paper", "“LiDAR-Only Dual-ROI Row Perception and Trajectory Generation for Autonomous Inter-Row Vineyard Mowing”, ROBOT 2026, Barcelona"),
    ],
    media=[
        vid("thesis/sim_run", "A run along an S-shaped corridor in Webots, with row detection in RViz: near and far regions of interest on each side, the corridor polygon and the planned path."),
        img("thesis/diag_8_rosbag_site1", "The robot in a vineyard corridor in the Douro."),
        img("thesis/diag_6_3_real_straight", "A real corridor after the first pass: the cut line separates mown from unmown grass."),
        img("thesis/diag_7_3_trajectory", "Near and far regions of interest on one vine row, and the planned path towards the next waypoint."),
        img("thesis/diag_8_heightmap_w2", "Vegetation height map built along a curved corridor."),
        img("thesis/diag_6_3_webots_curved", "One of the curved corridors used for evaluation in Webots."),
        img("thesis/diag_4_1", "System architecture: perception, mapping and planning nodes feeding the trajectory tracker."),
    ],
)

PROJECTS = [
    dict(
        id="quadruped", title="Quadruped spider robot",
        desc="A twelve-servo walking robot with several gaits, controlled by a Raspberry Pi Pico.",
        context="University project", stack="C++, Raspberry Pi Pico",
        thumb=f"{M}/spider/main.webp",
        writeup=[
            "A four-legged robot with three servos per leg, driven by a Raspberry Pi Pico through a PWM driver over I²C. A time-of-flight sensor and an IMU let it walk around obstacles and stay level.",
            "It walks forwards and backwards, turns on the spot, balances on a moving platform and changes its body height to clear obstacles. Leg trajectories are Bézier curves computed offline, and inverse kinematics run in real time. Each leg is its own object in the code, which kept the architecture modular.",
        ],
        specs=[("Controller", "Raspberry Pi Pico"), ("Actuators", "12 × 9 g servos, 3 per leg"), ("PWM driver", "Adafruit PCA9685"),
               ("Sensors", "VL53LXX-V2 time-of-flight, MPU-6050 IMU"), ("Language", "C++"),
               ("Gaits", "Straight walk, obstacle avoidance, rotation, balance")],
        media=[vid("spider/video_2", "Walking test, seen from above."), img("spider/main", "The robot on the workbench."),
               vid("spider/video3", "Walking test."), vid("spider/video_1", "Testing the gaits."),
               img("spider/image_1", "Early assembly with the wiring exposed.")],
    ),
    dict(
        id="boat-perception", title="LiDAR occupancy grid for an autonomous boat",
        desc="Real-time obstacle mapping, light enough for embedded hardware, that separates static from moving obstacles.",
        context="University project", stack="Python, ROS 2, Livox Mid-70",
        thumb=f"{M}/boat/image3.webp",
        writeup=[
            "A simplified perception system for an autonomous boat. It detects obstacles with a Livox Mid-70 LiDAR and keeps a persistent occupancy grid that is updated incrementally as new scans arrive.",
            "Every cell decays at a tuned rate, so measurement noise and obstacles that have moved fade out while static ones stay on the map. The map stays smooth and the whole system is cheap enough to run on embedded hardware.",
        ],
        specs=[("Map", "Occupancy grid with per-cell decay"), ("LiDAR", "Livox Mid-70"), ("Language", "Python"), ("Framework", "ROS 2 Humble")],
        media=[vid("boat/video1", "Occupancy grid, LiDAR points and camera view while the map updates."), img("boat/image3", "The boat in the test pool."),
               img("boat/image_4", "Occupancy grid map of the pool."), img("boat/image1", "Test pool with the boat and floating obstacles."), img("boat/image2", "The pool seen from above.")],
    ),
    dict(
        id="shot-detection", title="Basketball shot detection",
        desc="Decides from one fixed camera whether a shot goes in, using calibration and a partial 3D reconstruction.",
        context="University project", stack="YOLOv8, RANSAC, camera calibration",
        thumb=f"{M}/basket/image1.webp",
        writeup=[
            "The user marks a few points and lines on the first frame of a fixed-camera video. From these the system estimates the ground-plane homography with RANSAC and recovers the camera's calibration parameters.",
            "A YOLOv8 model trained on a custom dataset finds the ball in every frame and tracks it. Assuming the ball travels in a vertical shooting plane, the system reconstructs its path in 3D and decides whether it passed through the hoop.",
        ],
        specs=[("Input", "Fixed-camera video and a few user-selected points and lines"), ("Homography", "RANSAC"),
               ("Detector", "YOLOv8, trained on a custom dataset"), ("Reconstruction", "Partial 3D, vertical-plane constraint"),
               ("Accuracy", "90%"), ("Recall", "87.5%")],
        media=[vid("basket/basket_video1", "A shot classified from the fixed camera."), vid("basket/YOLO_test", "Ball detection with YOLOv8."),
               img("basket/image1", "Court calibration from user-selected points and lines."), img("basket/image2", "Rectified ground plane from the homography."),
               img("basket/image3", "The ball detected during a shot.")],
    ),
    dict(
        id="ball-balancer", title="Ball-and-beam balancer",
        desc="A PID loop keeps a ball centred on a beam tilted by a single servo.",
        context="University project", stack="PID, Arduino, MATLAB",
        thumb=f"{M}/ball/image_1.webp",
        writeup=[
            "A wooden beam that balances a ball using one servo. A time-of-flight sensor measures where the ball is, and a closed-loop PID controller adjusts the beam angle to keep it in the centre.",
            "I designed and simulated the controller in MATLAB from a simple second-order linear model of the open-loop system.",
        ],
        specs=[("Controller", "PID"), ("Microcontroller", "Arduino Uno"), ("Actuator", "MG996R servo"), ("Sensor", "VL53LXX-V2 time-of-flight")],
        media=[vid("ball/self_balancing_video2", "The ball returning to the centre after a push."), img("ball/image_1", "Beam, servo and sensor on the bench."),
               vid("ball/self_balancing_video1", "Holding the ball at the set point."), img("ball/image_2", "Wiring the Arduino.")],
    ),
    dict(
        id="robotic-arm", title="Six-axis robotic arm",
        desc="A desktop arm with forward and inverse kinematics, being built towards vision-guided manipulation.",
        context="Personal project", state="In progress", stack="C++, kinematics",
        thumb=f"{M}/arm/arm_image_2.webp",
        writeup=[
            "A six-degree-of-freedom arm I am building, from the control electronics to the forward and inverse kinematics. The aim is a precise arm with a teleoperation interface and programmable trajectories.",
            "Next come vision-based control and object manipulation, and then using the arm to train and deploy reinforcement learning policies and vision-language-action models.",
        ],
        specs=[("Degrees of freedom", "6"), ("Kinematics", "Forward and inverse"), ("Status", "In progress")],
        media=[img("arm/arm_image_2", "The arm in front of the kinematics derivation."), img("arm/arm_image_1", "The arm assembled on the desk.")],
    ),
    dict(
        id="parking-sensor", title="Parking space sensor",
        desc="A custom ESP32 board that reports over Wi-Fi whether the space outside my house is free.",
        context="Personal project", state="In progress", stack="ESP32, PCB design, Wi-Fi",
        thumb=f"{M}/park/park_pcb_1.webp",
        writeup=[
            "An embedded system built around a custom ESP32 board and a waterproof ultrasonic sensor that checks whether a parking space is occupied.",
            "Readings go over Wi-Fi to a web server, so I can check the space in front of my house from anywhere.",
        ],
        specs=[("Microcontroller", "ESP32"), ("Sensor", "JSN-SR04T ultrasonic"), ("Connectivity", "Wi-Fi"), ("Status", "In progress")],
        media=[img("park/park_pcb_1", "3D view of the board."), img("park/park_pcb_2", "PCB routing."), img("park/park_pcb_3", "Schematic.")],
    ),
]

EXPERIENCE = [
    dict(
        id="inesc-bii", title="Research grant in process control at INESC TEC",
        desc="Experiments on the EDIBON-UCP process-control platform, written up as a technical report.",
        context="Research initiation grant (BII), INESC TEC CRIIS iiLab", dates="Feb–Oct 2025", stack="Process control",
        thumb=f"{M}/inesc/edibon_ucp.webp",
        writeup=[
            "A research initiation grant at INESC TEC (CRIIS, iiLab) on process control, based on the EDIBON-UCP platform.",
            "I ran experiments, analysed how several systems behaved under different control configurations, and wrote a technical document describing the method, the setup and the results.",
        ],
        specs=[("Dates", "February to October 2025"), ("Institution", "INESC TEC, CRIIS (iiLab)"), ("Type", "Research initiation grant (BII)"), ("Platform", "EDIBON-UCP"), ("Output", "Technical document")],
        media=[img("inesc/edibon_ucp", "The EDIBON-UCP platform."), img("inesc/edibon_control_box", "Control box."),
               img("inesc/edibon_scada", "SCADA software."), img("inesc/iilab", "The iiLab at INESC TEC.")],
    ),
    dict(
        id="continental", title="Vertical warehouse integration at Continental Mabor",
        desc="Connected an automated vertical warehouse to the plant's Manufacturing Execution System over OPC UA.",
        context="Capstone internship, Continental Mabor", dates="Feb–Jul 2024", stack="OPC UA, C#, Structured Text",
        thumb=f"{M}/conti/conti_vertical_warehouse.webp",
        writeup=[
            "My capstone internship at Continental Mabor. The goal was to integrate a vertical automated warehouse into the company's existing Manufacturing Execution System using the OPC UA standard.",
            "I analysed the existing infrastructure, designed the integration architecture, and implemented and validated the communication layer between the warehouse PLC and the MES.",
        ],
        specs=[("Dates", "February to July 2024"), ("Company", "Continental Mabor"), ("Standards", "OPC UA, IEC 61131-3"), ("Languages", "C#, Structured Text"), ("Target system", "MES")],
        media=[img("conti/conti_vertical_warehouse", "Inside the vertical warehouse."), img("conti/continental_25", "The warehouse."),
               img("conti/continental_26", "Tyres at the warehouse."), img("conti/Continental-Mabor1", "Continental Mabor.")],
    ),
]


def item(p, feature=False):
    meta = [f'<span class="dates">{e(p["dates"])}</span>'] if p.get("dates") else []
    meta.append(f'<span>{e(p["context"])}</span>')
    if p.get("state"):
        meta.append(f'<span class="state">{e(p["state"])}</span>')
    meta.append(f'<span>{e(p["stack"])}</span>')
    strip = []
    for i, m in enumerate(p["media"]):
        attrs = f'data-type="{m["type"]}" data-src="{m["src"]}" data-alt="{e(m["alt"])}"'
        if m.get("poster"):
            attrs += f' data-poster="{m["poster"]}"'
        label = ("Play video: " if m["type"] == "video" else "Show image: ") + m["alt"]
        cls = ' class="is-video"' if m["type"] == "video" else ""
        strip.append(f'<li><button type="button"{cls} {attrs} aria-label="{e(label)}" aria-current="false">'
                     f'<img src="{m["thumb"]}" alt="" loading="lazy" decoding="async"></button></li>')
    specs = "".join(f"<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>" for k, v in p["specs"])
    paras = "".join(f"<p>{e(t)}</p>" for t in p["writeup"])
    if feature:
        head = f'<summary class="visually-hidden" tabindex="-1">{e(p["title"])}: full write-up</summary>'
    else:
        head = f"""<summary class="row">
    <img src="{p['thumb']}" alt="" loading="lazy" decoding="async">
    <h3 class="title">{e(p['title'])}</h3>
    <span class="desc">{e(p['desc'])}</span>
    <span class="meta">{''.join(meta)}</span>
    <span class="toggle" aria-hidden="true"></span>
  </summary>"""
    cls = "item item--feature" if feature else "item"
    return f"""
<details class="{cls}" id="{p['id']}" name="projects">
  {head}
  <div class="panel">
    <figure class="viewer">
      <div class="stage"></div>
      <ul class="strip">{''.join(strip)}</ul>
      <figcaption></figcaption>
    </figure>
    <div class="writeup">
      {paras}
      <dl class="specs">{specs}</dl>
    </div>
  </div>
</details>"""


T = THESIS
thesis_row = dict(T, context=f'{T["context"]}, {T["year"]}')

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>David Salazar Brás, robotics engineer</title>
<meta name="description" content="Perception and planning for outdoor robots. Projects in LiDAR perception, computer vision, control and embedded systems by David Salazar Brás, Electrical and Computer Engineer (MSc, FEUP).">
<meta property="og:title" content="David Salazar Brás, robotics engineer">
<meta property="og:description" content="Perception and planning for outdoor robots, mainly with LiDAR.">
<meta property="og:image" content="https://davidsalazar03.github.io/{M}/thesis/diag_8_rosbag_site1.webp">
<meta name="theme-color" content="#161c19">
<link rel="preload" href="assets/fonts/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="site-header">
  <div class="wrap">
    <a class="home" href="#top">David Salazar Brás</a>
    <nav aria-label="Main">
      <ul>
        <li><a href="#work">Projects</a></li>
        <li><a href="#experience">Experience</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <canvas id="cloud" aria-hidden="true"></canvas>
  <div class="wrap">
    <h1>David Salazar Brás</h1>
    <p class="lede">Electrical and Computer Engineer, MSc from FEUP, based in Porto, Portugal.</p>
    <p class="fact">Perception, planning and embedded systems for robots.</p>
    <p class="links">
      <a class="primary" href="#work">See projects</a>
      <a href="https://www.linkedin.com/in/david-salazar-bras" rel="noopener">LinkedIn</a>
      <a href="https://github.com/davidsalazar03" rel="noopener">GitHub</a>
    </p>
  </div>
  <p class="hero-note">A vineyard corridor as a LiDAR point cloud, coloured by height, with a robot mowing its second pass. Drag to look around.</p>
</section>

<section class="block" id="work" aria-labelledby="work-h">
  <div class="wrap">
    <div class="block-head">
      <h2 id="work-h">Projects</h2>
      <p>University and personal work, from LiDAR pipelines, computer vision and control algorithms to firmware and circuit boards.</p>
    </div>

    <article class="feature" aria-labelledby="feature-h">
      <figure><video class="cover" src="{M}/thesis/sim_run.mp4" poster="{M}/thesis/sim_run.jpg" autoplay muted loop playsinline preload="metadata" aria-label="Top-down view of the robot driving along an S-shaped vineyard corridor in Webots."></video></figure>
      <div>
        <p class="context">My MSc thesis</p>
        <h3 id="feature-h">{e(T['title'])}</h3>
        <p class="summary">{e(T['desc'])} Evaluated in 20 simulated vineyards and on data from a real one.</p>
        <dl class="results">
          <div><dt>MSc thesis</dt><dd>FEUP and INESC TEC, 2026</dd></div>
          <div><dt>Grade</dt><dd>19/20</dd></div>
          <div><dt>Row-line lateral error</dt><dd>&lt; 0.10 m</dd></div>
          <div><dt>Perception time per sweep</dt><dd>&lt; 23 ms</dd></div>
          <div class="stacked"><dt>Paper published at ROBOT 2026, Barcelona</dt><dd>LiDAR-Only Dual-ROI Row Perception and Trajectory Generation for Autonomous Inter-Row Vineyard Mowing</dd></div>
        </dl>
        <button class="open-link" type="button" data-open="thesis" aria-controls="thesis" aria-expanded="false">Read the full write-up</button>
      </div>
    </article>
    {item(thesis_row, feature=True)}

    <div class="list">
      {''.join(item(p) for p in PROJECTS)}
    </div>
  </div>
</section>

<section class="block" id="experience" aria-labelledby="exp-h">
  <div class="wrap">
    <div class="block-head">
      <h2 id="exp-h">Experience</h2>
      <p>Industry and research work alongside my degree.</p>
    </div>
    <div class="list">
      {''.join(item(p) for p in EXPERIENCE)}
    </div>
  </div>
</section>

<section class="block" id="about" aria-labelledby="about-h">
  <div class="wrap">
    <div class="block-head"><h2 id="about-h">About</h2></div>
    <div class="about">
      <div class="prose">
        <img class="portrait" src="{M}/profile.webp" alt="David Salazar Brás" width="320" height="320" loading="lazy" decoding="async">
        <p>I am an Electrical and Computer Engineer from Porto, Portugal. I finished my MSc at FEUP in 2026, in Automation and Robotics, with a focus on autonomous robots, computer vision and machine learning. I spent a semester of it at Politecnico di Milano.</p>
        <p>My recent work is mostly perception and planning algorithms for mobile robots, usually with LiDAR. Before that I worked on embedded systems, control and industrial automation, and I still build hardware projects of my own.</p>
        <p>I keep a <a href="https://v2-embednotion.com/91cd74b1e6a483f181a3014f3c0ae1f2" rel="noopener">Map of Knowledge</a> in Notion: notes, derivations and code I write until I can explain a topic simply and implement it.</p>
        <p>I am open to PhD positions and engineering roles in autonomous robotics and perception.</p>
      </div>
      <div>
        <h3>Education</h3>
        <ul class="facts">
          <li><span class="when">2026</span><span class="what">MSc in Electrical and Computer Engineering, FEUP</span><span class="detail">Automation and Robotics. Final grade 17/20, thesis 19/20.</span></li>
          <li><span class="when">Sep 2025 to Feb 2026</span><span class="what">Erasmus semester, Politecnico di Milano</span><span class="detail">Autonomous Robots and Vehicles, Multi-Agent Systems, Computer Vision, Safety-Critical Systems.</span></li>
        </ul>
        <h3>Tools</h3>
        <ul class="facts">
          <li><span class="what">Perception</span><span class="detail">LiDAR point clouds, SONAR processing, RANSAC, OpenCV, YOLO, camera calibration</span></li>
          <li><span class="what">Robotics</span><span class="detail">ROS 2, Webots, kinematics, trajectory planning, controller design in MATLAB and Simulink</span></li>
          <li><span class="what">Embedded</span><span class="detail">Arduino, ESP32, Raspberry Pi, KiCad, PLCs, IoT</span></li>
          <li><span class="what">Languages</span><span class="detail">C++, Python, C, C#, MATLAB</span></li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="block contact" id="contact" aria-labelledby="contact-h">
  <div class="wrap">
    <h2 class="big" id="contact-h">The quickest way to reach me is a message on LinkedIn.</h2>
    <p class="links">
      <a href="https://www.linkedin.com/in/david-salazar-bras" rel="noopener">LinkedIn</a>
      <a href="https://github.com/davidsalazar03" rel="noopener">GitHub</a>
    </p>
  </div>
</section>
</main>

<footer class="site-footer">
  <div class="wrap">
    <p>David Salazar Brás, <span id="year">2026</span></p>
    <p class="disclaimer">About this website: I vibe-coded it with Claude, an AI assistant. My focus is robotics, automation and machine learning, not UI and UX design, so that is where my effort went. Every project shown here is entirely my own work.</p>
  </div>
</footer>

<script src="assets/pointcloud.js" defer></script>
<script src="assets/site.js" defer></script>
</body>
</html>
"""

import sys
import os
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "index.html")
open(out, "w", encoding="utf-8").write(html)
print("ok")
