## Synopsis
Fact Layer provides helpful contextual information on many sites while you browse the internet.

Some of the features include:

1. Integration into social networking / news aggregation sites, to make it easier to tell if a news item is worth clicking into. Currently Reddit and Digg are supported.

2. Bias information on more than 2,000 news/media sites.

3. Information on satire, fake news, and extremely unreliable sources.

4. Article specific fact checking lookup that displays the number of factual statements that are disputed.

5. Information on around 8,000 charities.

6. Automated detection of some fake local news sites (i.e actionews3.com, channel22news.com, etc). 

All site information queries are done locally, meaning no information is sent to me about your browsing activities at any time.

## Motivation

This project was born out of my annoyance with having to constantly Google articles to see if what I was reading was legitamite. I've tried other similar plugins in the past, but I feel they're too opinion based. By limiting the information to known reference sites and fact checking services, I hope to prevent (or at least lessen) false tagging of sources as "fake news" or "extremely bias" simply because a particuler community doesn't agree with it. Nothing is a substitute for doing your own research, but not everyone has time to look into every article and news source they come accross. That's where this plugin comes into play! 

## FAQs ##

_Where do you get the information?_

**I try to use as many unbiased sources as possible. Currently they include AllSides, Media Bias / Fact Check, Real or Satire, The Fake News Codex, TV News Check, Charity Navigator, and Wikipedia. Also, any information the plugin displays includes links to the specific article it's sourcing.**

_How do you store the information and is it dynamic?_

**In a series of json files. The plugin takes the approach of ad blockers in that it will periodically request updated information to stay current in site information and fact checks. Once downloaded it's stored in the local browser storage.**

_Do you have any editorial input?_

**Very little, by design. There's certain situations where I need to make judgement calls on how to interpret the data, but it's kept to a minimum. One example of that is how I deal with sources disagreeing on the rating of a site. I give some ratings more weight then others, to determine which icon to show in the toolbar.**
