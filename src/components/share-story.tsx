import { LogoGlyph } from "@/components/brand";

export function ShareStory() {
  return (
    <figure className="share-story">
      <svg className="story-definitions" aria-hidden="true">
        <defs>
          <g
            id="story-paper"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          >
            <path d="M0 0H30L42 12V55H0Z" fill="var(--paper)" />
            <path d="M30 0V12H42" fill="var(--wash)" />
            <path d="m13 26-6 5 6 5m16-10 6 5-6 5m-7-13-4 17" fill="none" />
          </g>
          <g
            id="story-author"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* An agent at a real little workbench, with a local HTML editor. */}
            <path
              d="M14 227H305M40 228V292M279 228V292M40 248H279"
              fill="none"
            />
            <path d="M179 211H290V225H179Z" fill="var(--wash)" />
            <path
              d="M126 70H299Q306 70 306 78V201H119V78Q119 70 126 70Z"
              fill="var(--paper)"
            />
            <path d="M129 93H296V190H129Z" fill="var(--ink)" />
            <path d="M119 201H306L320 213H106Z" fill="var(--wash)" />
            <path d="M194 204H231L235 209H190Z" fill="var(--paper)" />
            <circle cx="132" cy="82" r="2" fill="currentColor" />
            <circle cx="140" cy="82" r="2" fill="currentColor" />
            <text x="158" y="86" stroke="none" fontSize="10">
              localhost / design.html
            </text>
            <g stroke="var(--code-ink)" fill="none">
              <path d="m143 110 5-4m-5 4 5 4m6-8h32m-32 12h61m-61 12h44m-44 12h88m-88 12h65m-65 12h34m-34 12h46" />
              <path
                d="M236 107H282V137H236Z"
                fill="var(--accent)"
                stroke="none"
              />
              <path d="M243 129V119h9v10m5 0v-16h9v16m5 0v-8h5v8" />
              <path d="M240 148H280M240 155H269M240 162H276" opacity=".6" />
            </g>
            {/* Robot face and articulated hands. */}
            <path
              d="M46 147V126Q46 101 73 101H85Q110 101 110 127V148"
              fill="var(--wash)"
            />
            <rect
              x="43"
              y="115"
              width="71"
              height="53"
              rx="20"
              fill="var(--paper)"
            />
            <rect
              x="35"
              y="128"
              width="9"
              height="23"
              rx="4"
              fill="var(--accent)"
            />
            <rect
              x="113"
              y="128"
              width="9"
              height="23"
              rx="4"
              fill="var(--accent)"
            />
            <path d="M77 104V91" fill="none" />
            <circle cx="77" cy="87" r="4" fill="var(--accent)" />
            <rect
              x="57"
              y="129"
              width="43"
              height="21"
              rx="8"
              fill="var(--wash)"
            />
            <path d="M69 137V142M89 137V142M74 153Q79 157 84 153" fill="none" />
            <path d="M62 168 54 186V215H105V187L94 168" fill="var(--wash)" />
            <path
              d="M55 181 36 193Q30 199 39 204L66 214M103 184 118 204 144 203"
              fill="none"
              strokeWidth="9"
            />
            <path
              d="M55 181 36 193Q30 199 39 204L66 214M103 184 118 204 144 203"
              fill="none"
              stroke="var(--paper)"
              strokeWidth="6"
            />
            <circle cx="145" cy="203" r="5" fill="var(--wash)" />
            <path
              d="M62 230V256H82L91 280M103 230V249L125 272"
              fill="none"
              strokeWidth="10"
            />
            <path
              d="M62 230V256H82L91 280M103 230V249L125 272"
              fill="none"
              stroke="var(--wash)"
              strokeWidth="7"
            />
            <path
              d="M80 280H101M119 275H135M44 221H115V231H44Z"
              fill="var(--paper)"
            />
            <path d="M73 232V287M54 291 73 286 92 291" fill="none" />
            <path d="M23 217H7L4 195H26Z" fill="var(--wash)" />
            <path
              d="M9 194C-8 180 9 168 14 190 12 171 32 172 19 194M15 214V188"
              fill="var(--wash)"
            />
            <path
              d="M253 214H267V225H253ZM267 216H271V222H268"
              fill="var(--paper)"
            />
          </g>
          <g
            id="story-host"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* The HTMLinks dispatch station turns the file into a share link. */}
            <path
              d="M14 80Q14 9 83 9Q152 9 152 80V241H14Z"
              fill="var(--wash)"
            />
            <path
              d="M24 81Q24 20 83 20Q142 20 142 81V230H24Z"
              fill="var(--paper)"
            />
            <path d="M41 111H124V176H41Z" fill="var(--wash)" />
            <path d="M35 107H131V119H35Z" fill="var(--accent)" />
            <g transform="translate(56 122) scale(.82)" fill="var(--accent)">
              <LogoGlyph />
            </g>
            <path d="M40 196H126V213H40Z" fill="var(--wash)" />
            <path d="M51 204H94" fill="none" />
            <circle
              className="host-light"
              cx="115"
              cy="204"
              r="3"
              fill="var(--accent)"
              stroke="none"
            />
            <path d="M4 241H162V252H4Z" fill="var(--wash)" />
            <text
              x="83"
              y="79"
              textAnchor="middle"
              fontSize="19"
              stroke="none"
              fill="var(--ink)"
            >
              HTMLinks
            </text>
          </g>
          <g
            id="story-station-paper"
            className="station-paper"
            strokeLinecap="round"
          >
            <use
              href="#story-paper"
              x="52"
              y="-18"
              transform="rotate(-11 73 10)"
            />
          </g>
          <g
            id="story-signal"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M83 10V-5" fill="none" />
            <circle cx="83" cy="-10" r="5" fill="var(--accent)" />
            <path
              d="M68-22Q83-35 98-22M60-31Q83-51 106-31"
              fill="none"
              stroke="var(--accent)"
            />
          </g>
          <g
            id="story-readers"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* The recipient needs a browser, and nothing else. */}
            <rect
              x="56"
              y="10"
              width="236"
              height="173"
              rx="8"
              fill="var(--paper)"
            />
            <path d="M56 37H292" fill="none" />
            <circle cx="69" cy="24" r="2" fill="currentColor" />
            <circle cx="77" cy="24" r="2" fill="currentColor" />
            <rect
              x="97"
              y="18"
              width="161"
              height="14"
              rx="5"
              fill="var(--wash)"
              stroke="none"
            />
            <path d="M105 24h5m-5 3h5" />
            <text
              x="116"
              y="28"
              fontSize="var(--story-address-size, 9px)"
              stroke="none"
            >
              HTMLinks / your-design
            </text>
            <text x="76" y="66" fontSize="18" stroke="none" fill="var(--ink)">
              A better way forward.
            </text>
            <path d="M77 78H222M77 85H191" opacity=".5" />
            <rect
              x="77"
              y="104"
              width="48"
              height="24"
              rx="3"
              fill="var(--wash)"
            />
            <rect
              x="147"
              y="104"
              width="48"
              height="24"
              rx="3"
              fill="var(--wash)"
            />
            <rect
              x="217"
              y="104"
              width="48"
              height="24"
              rx="3"
              fill="var(--accent)"
            />
            <path
              d="M125 116H147M195 116H217M138 112l4 4-4 4M208 112l4 4-4 4"
              fill="none"
            />
            <path d="M83 146H151M83 154H232M83 162H206" opacity=".45" />
            <path d="M161 184V197H186V184M139 199H208" fill="var(--wash)" />
            <g className="reader-phone">
              <rect
                x="276"
                y="146"
                width="58"
                height="106"
                rx="9"
                fill="var(--wash)"
              />
              <rect
                x="282"
                y="155"
                width="46"
                height="82"
                rx="3"
                fill="var(--paper)"
              />
              <path d="M298 151H312M289 168H319M289 175H310M289 213H319M289 219H311" />
              <path
                d="M289 203V188H295V203M301 203V181H307V203M313 203V192H319V203"
                fill="var(--accent)"
                stroke="none"
              />
              <circle cx="305" cy="244" r="2" fill="currentColor" />
            </g>
            <path d="M-2 210H254M17 211V289M228 211V289" fill="none" />
            <path
              d="M32 178Q11 163 10 142Q9 123 27 120Q49 117 51 140L45 163"
              fill="var(--wash)"
            />
            <path
              d="M21 124Q7 124 8 141Q9 155 21 156L23 142Q33 147 45 136L48 141Q49 119 30 119"
              fill="var(--ink)"
            />
            <path
              d="M23 162V176L42 181V161M41 148H47L44 153M37 141V144"
              fill="var(--paper)"
            />
            <path
              d="M22 175Q7 177 5 197L0 229H63L56 191Q53 181 43 180"
              fill="var(--accent)"
            />
            <path
              d="M44 189 59 203H100M16 190 18 210 57 215"
              fill="none"
              strokeWidth="9"
            />
            <path
              d="M44 189 59 203H100M16 190 18 210 57 215"
              fill="none"
              stroke="var(--paper)"
              strokeWidth="6"
            />
            <path
              d="M12 231 9 257H42L56 283M52 231 66 253 86 274"
              fill="none"
              strokeWidth="11"
            />
            <path
              d="M12 231 9 257H42L56 283M52 231 66 253 86 274"
              fill="none"
              stroke="var(--wash)"
              strokeWidth="8"
            />
            <path
              d="M47 285H68M79 278H97M-5 231H62V239H-5ZM14 239V286M0 292 14 286 28 292"
              fill="var(--paper)"
            />
            <path d="M98 198H164L173 207H88Z" fill="var(--wash)" />
          </g>
        </defs>
      </svg>
      <svg
        className="story-desktop"
        viewBox="0 0 1120 385"
        role="img"
        aria-labelledby="story-title"
      >
        <title id="story-title">
          Your coding agent creates a local HTML file, HTMLinks publishes it,
          and others open the link in their browser.
        </title>
        <g
          fill="none"
          stroke="var(--route)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path
            d="M283 124C365-10 428 11 520 100M608 105C685 4 744 4 846 50"
            strokeDasharray="4 9"
          />
          <path d="m506 92 14 8-1-16m309-34 18 0-6-15" />
          <path d="M945 365C945 395 560 335 560 385" />
        </g>
        <use href="#story-author" x="20" y="27" />
        <use href="#story-signal" x="477" y="65" />
        <use href="#story-host" x="477" y="65" />
        <use
          className="station-arrival"
          href="#story-station-paper"
          x="477"
          y="65"
        />
        <use href="#story-readers" x="760" y="26" />
        <g className="outgoing-paper">
          <use
            href="#story-paper"
            x="375"
            y="21"
            transform="rotate(14 396 47)"
          />
        </g>
        <g className="incoming-paper">
          <use
            href="#story-paper"
            x="684"
            y="17"
            transform="rotate(-12 705 43)"
          />
        </g>
        <g fill="var(--ink)" fontSize="16" textAnchor="middle">
          <text x="185" y="354">
            Your agent creates.
          </text>
          <text x="560" y="354">
            HTMLinks shares.
          </text>
          <text x="943" y="354">
            Everyone opens.
          </text>
        </g>
      </svg>
      <svg
        className="story-mobile"
        viewBox="0 0 360 490"
        role="img"
        aria-label="From your agent’s local HTML file, through HTMLinks, to anyone’s browser."
      >
        <defs>
          <marker
            id="story-mobile-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path
              d="M2 1L8 5L2 9"
              fill="none"
              stroke="var(--route)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        <g
          fill="none"
          stroke="var(--route)"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path
            d="M236 251H216Q180 251 180 277V282"
            markerEnd="url(#story-mobile-arrow)"
          />
          <path d="M192 465C192 480 180 478 180 490" />
        </g>
        <use href="#story-author" transform="translate(3 15) scale(.63)" />
        <use href="#story-host" transform="translate(230 135) scale(.65)" />
        <use href="#story-readers" transform="translate(24 283) scale(.58)" />
        <g fill="var(--ink)" fontSize="14">
          <text x="35" y="221">
            Your agent creates.
          </text>
          <text x="217" y="320">
            HTMLinks shares.
          </text>
          <text x="227" y="433">
            Everyone
          </text>
          <text x="227" y="451">
            opens.
          </text>
        </g>
        <g data-story-delivery>
          <path
            className="story-delivery-route"
            d="M208 62C246 16 303 34 292 100Q289 121 277.5 141.5"
            fill="none"
            stroke="var(--route)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="4 8"
            markerEnd="url(#story-mobile-arrow)"
          />
          <g
            className="story-delivery-paper"
            transform="translate(277.5 141.5) rotate(-11)"
          >
            <use href="#story-paper" x="-21" y="-27.5" transform="scale(.65)" />
          </g>
        </g>
      </svg>
      <figcaption className="sr-only">
        From a file on your computer to a link for everyone. No account or
        management UI required.
      </figcaption>
    </figure>
  );
}
