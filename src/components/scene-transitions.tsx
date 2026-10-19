type TransitionKind = "view" | "install" | "host";

function FileFlight({ mobile }: { mobile: boolean }) {
  const path = mobile
    ? "M180 0C180 55 320 5 320 65S75 75 75 140"
    : "M560 0C560 85 1060 0 1060 93S215 80 215 180";
  return (
    <>
      {/* Only the background stretches; the file and its route keep their shape. */}
      <svg
        className={`file-flight flight-background ${mobile ? "flight-mobile" : "flight-desktop"}`}
        viewBox={mobile ? "0 0 360 140" : "0 0 1120 180"}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="scene-edge"
          d={
            mobile
              ? "M0 50C120 135 240 0 360 55V140H0Z"
              : "M0 55C350 180 800-35 1120 70V180H0Z"
          }
        />
      </svg>
      <svg
        className={`file-flight ${mobile ? "flight-mobile" : "flight-desktop"}`}
        viewBox={mobile ? "0 0 360 140" : "0 0 1120 180"}
        data-flight
        aria-hidden="true"
      >
        <path className="flight-track" d={path} />
        <path className="flight-route" d={path} />
        <g
          className="flight-paper"
          transform={`translate(${mobile ? 180 : 560} 0)`}
        >
          <use href="#story-paper" x="-21" y="-27" />
        </g>
      </svg>
    </>
  );
}

export function SceneTransition({ kind }: { kind: TransitionKind }) {
  if (kind === "view") {
    return (
      <div className="scene-transition transition-view">
        <FileFlight mobile={false} />
        <FileFlight mobile />
      </div>
    );
  }
  const edges = {
    install: "M0 145L370 145Q420 145 455 180L520 235H1120V280H0Z",
    host: "M0 245C220 245 325 105 560 105S920 245 1120 245V280H0Z",
  };
  function artwork(mobile: boolean) {
    return (
      <svg
        className={`transition-art ${mobile ? "transition-mobile" : "transition-desktop"}`}
        viewBox={mobile ? "0 0 360 260" : "0 0 1120 280"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {kind === "install" && <PromptToLink mobile={mobile} />}
        {kind === "host" && <DeploymentBranch mobile={mobile} />}
      </svg>
    );
  }
  return (
    <div className={`scene-transition transition-${kind}`} data-transition>
      <svg
        className="transition-boundary"
        viewBox="0 0 1120 280"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="scene-edge" d={edges[kind]} />
      </svg>
      {artwork(false)}
      {artwork(true)}
      {kind === "install" && (
        <p className="transition-caption link-caption" aria-hidden="true">
          A link. A password, if you want.
        </p>
      )}
    </div>
  );
}

function PromptToLink({ mobile }: { mobile: boolean }) {
  return (
    <>
      <g data-network className="publish-cable">
        <path
          data-draw
          d={
            mobile
              ? "M237 90H260Q276 90 276 106V126Q276 142 260 142H114Q98 142 98 158V176Q98 188 114 188H125"
              : "M417 131H488Q510 131 510 153V183Q510 205 532 205H650"
          }
        />
        <circle r="5" className="signal" />
        <circle r="3" className="signal" />
        <circle r="2" className="signal" />
      </g>
      <g
        transform={`translate(${mobile ? 32 : 178} ${mobile ? 22 : 38}) scale(${mobile ? 0.83 : 1})`}
      >
        <g className="publish-terminal">
          <rect width="248" height="114" rx="9" className="terminal-body" />
          <path d="M0 27H248M15 14H19M27 14H31M39 14H43" />
          <path d="m19 49 7 6-7 6" />
          <text x="39" y="60" stroke="none" fontSize="15">
            share design.html
          </text>
          <g className="terminal-response">
            <path d="m19 85 4 4 8-9" />
            <text x="39" y="89" stroke="none" fontSize="13">
              Your link is ready.
            </text>
          </g>
          <path d="M248 82H257V100H248" className="terminal-plug" />
        </g>
      </g>
      <g
        transform={`translate(${mobile ? 140 : 650} ${mobile ? 168 : 178}) scale(${mobile ? 0.82 : 1})`}
      >
        <g className="publish-link">
          <rect
            x="-19"
            y="-22"
            width="263"
            height="58"
            rx="29"
            className="art-paper"
          />
          <g transform="translate(11 7) rotate(-38)">
            <rect
              className="chain-left"
              x="-16"
              y="-8"
              width="25"
              height="16"
              rx="8"
            />
            <rect
              className="chain-right"
              x="-2"
              y="-8"
              width="25"
              height="16"
              rx="8"
            />
            <path d="M-2 0H9" />
          </g>
          <text x="51" y="12" stroke="none" fontSize="17">
            HTMLinks / design
          </text>
          <g transform="translate(213 5)">
            <g className="link-lock">
              <path d="M-6-2V-7a6 6 0 0 1 12 0V-2" />
              <rect
                x="-9"
                y="-2"
                width="18"
                height="15"
                rx="3"
                className="art-wash"
              />
              <path d="M0 4V7" />
            </g>
          </g>
        </g>
      </g>
      <path
        className="publish-spark"
        d={
          mobile
            ? "m340 152 4-9m1 25 12-1m-15 15 8 6"
            : "m928 155 8-15m8 36 18-3m-16 24 15 9"
        }
      />
    </>
  );
}

function DeploymentBranch({ mobile }: { mobile: boolean }) {
  const center = mobile ? 180 : 560;
  const cloud = mobile ? 75 : 321;
  const server = mobile ? 282 : 800;
  return (
    <>
      <g data-network className="deployment-wire">
        <path
          data-draw
          d={`M${center} 59V82Q${center} 100 ${center - 20} 100H${cloud + 20}Q${cloud} 100 ${cloud} 120V137`}
        />
        <circle r="4" className="signal" />
        <circle r="3" className="signal" />
      </g>
      <g data-network className="deployment-wire own-server-wire">
        <path
          data-draw
          d={`M${center} 59V82Q${center} 100 ${center + 20} 100H${server - 20}Q${server} 100 ${server} 120V137`}
        />
        <circle r="5" className="signal" />
        <circle r="3" className="signal" />
        <circle r="2" className="signal" />
      </g>
      <g transform={`translate(${center} 35)`}>
        <g className="deploy-hub">
          <rect
            x="-30"
            y="-23"
            width="60"
            height="46"
            rx="12"
            className="art-paper"
          />
          <path d="M-10-11V11M10-11V11M-10 0H10" strokeWidth="4" />
          <circle cx="0" cy="38" r="4" className="art-solid" />
        </g>
      </g>
      <g transform={`translate(${cloud} 171) scale(${mobile ? 0.8 : 1})`}>
        <g className="deploy-cloud">
          <path
            d="M-44 28a27 27 0 0 1-5-53 32 32 0 0 1 60-14 23 23 0 0 1 34 23 22 22 0 0 1-1 44Z"
            className="art-paper"
          />
          <path d="m-10 4 10-11L10 4M0-7V22" />
          <path d="M-60 36H60" className="art-muted" />
        </g>
        <text x="0" y="65" textAnchor="middle" fontSize="16" stroke="none">
          Managed
        </text>
      </g>
      <g transform={`translate(${server} 143) scale(${mobile ? 0.84 : 1})`}>
        <path
          d="M-65 81V-9Q-65-18-56-18H56Q65-18 65-9V81M-73 81H73M-52 82V90M52 82V90"
          className="rack-frame"
        />
        {[0, 1, 2].map((row) => (
          <g key={row} transform={`translate(0 ${row * 27})`}>
            <g className={`server-tray server-tray-${row}`}>
              <rect
                x="-53"
                y="-6"
                width="106"
                height="22"
                rx="3"
                className="art-paper"
              />
              <circle
                cx="-40"
                cy="5"
                r="3"
                className="server-led art-solid"
                stroke="none"
              />
              <path d="M-24 2H10M-24 8H3M31 1V9M38 1V9M45 1V9" />
            </g>
          </g>
        ))}
        <text x="0" y="115" textAnchor="middle" fontSize="16" stroke="none">
          Your server
        </text>
      </g>
    </>
  );
}
