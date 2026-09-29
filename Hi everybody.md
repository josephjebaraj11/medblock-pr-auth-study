Hi everybody. Thanks for joining us today. Uh my name is Joe Shankweiler and I lead uh Google's healthcare and life science uh startup team here at Google
0:1717 secondsCloud. Uh I'm thrilled to kick off this five-part series called Startup School focusing on health technology. Over the next several sessions, we're bringing
0:2626 secondstogether builders, technical specialists, venture investors, a whole range of folks that are going to be relevant to this space. Um, uh, we've
0:3535 secondsstarting today with a really important session on Google's open health AI development or high def. Developing AI
0:4343 secondsin healthcare carries a unique demand around data safety, clinical nuance, model alignment, and open models are
0:5050 secondsfundamentally changing how fast startups can grow and move. And I'm we're thrilled today to be joined by Dan Golden from the Google research team to
0:5858 secondsexplore the Med Gemma ecosystem, fine-tuning techniques for medical tasks and responsible deployment practices.
1:051 minute, 5 secondsAnd before I hand it over to Dan, just a quick housekeeping note. Um, use the chat feature directly below the webinar
1:121 minute, 12 secondswindow to introduce yourself, network with fellow founders, and drop in your questions throughout the talk. We have a team of Google Cloud experts um, live on
1:211 minute, 21 secondsstandby to chat right now to answer any of those technical questions that arise.
1:251 minute, 25 secondsAnd we'll also be pulling in the top questions at the end for a Q&A with Dan to dig into some of these areas. Um, so that's the housekeeping section and and
1:341 minute, 34 secondswithout further ado, Dan, uh, over to you.
1:371 minute, 37 secondsAll right. Thanks so much, Joe. All right, thank you everyone for joining.
1:401 minute, 40 secondsUh, my name is Dan. I'm a software engineering manager in Google research at Google. And today I'm going to be talking about Google's open models for
1:491 minute, 49 secondshealth AI development and specifically Medgema of which I'm the research lead.
1:551 minute, 55 secondsSo a little bit of background about health AI at Google before we get into the models themselves. For a long time now, uh, our our program within Google
2:042 minutes, 4 secondsresearch has been focused on the principle of catalyzing the adoption of human- centered AI in healthcare. For a long time, we've done this via
2:122 minutes, 12 secondsdemonstrations. These are our own internal studies, often with with collaborators and partners to show the possibilities of using AI in clinical
2:212 minutes, 21 secondsresearch and healthcare. More recently, we've been focused on supporting the community directly by building tools and
2:302 minutes, 30 secondsuh foundation models to help them develop health AI applications. And that's the principle behind the highdev program which stands for health AI
2:382 minutes, 38 secondsdeveloper foundations where we are releasing pre-trained models and supporting tools to enable thirdparty developers to build healthcare applications.
2:492 minutes, 49 secondsThe idea behind high def is that we have both the models and the tools enabling people via both uh these foundational
2:582 minutes, 58 secondselements and then also instructing them how to use them most effectively. There are instructions as well as frameworks and and tools for that. The important
3:073 minutes, 7 secondsaspect of this also is that all of the tools we release have an enabling license that allows them to be used completely free and without any
3:143 minutes, 14 secondsobligation to Google. So they can be built into applications, they can be used offline. There is no required payments per inference run or anything
3:223 minutes, 22 secondslike that. These tools can be kind of adopted and owned by the users and developers.
3:303 minutes, 30 secondsThe principle behind this program is that within healthc care development and health AI development and the development of products for patients and
3:393 minutes, 39 secondsclinicians, there isn't one organization that's really able to do everything.
3:433 minutes, 43 secondsThere are AI research institutes like Google cloud providers like Google by uh Google cloud health care providers those
3:513 minutes, 51 secondsactually providing the services and health tech providers who are creating medical products and no one of these uh individual institutions can do
3:583 minutes, 58 secondseverything. So we are enabling uh via the the elements that we have the most leverage in in the developing AI
4:054 minutes, 5 secondsapplications to allow these users to all come together to build effective applications for healthcare.
4:144 minutes, 14 secondsWithin healthi developer foundations we have the medgeema family of models which I'll be talking in more detail about later in the webinar. But we also have
4:224 minutes, 22 secondsseveral other models that are more specialized for specific applications including Med ASR which is optimized for medical speech to text. Meds Sigip which
4:314 minutes, 31 secondsis an image encoder optimized for classification or retrieval of medical images. TXGMema which is optimized for therapeutics, comprehension and question
4:394 minutes, 39 secondsanswering and the hear model which is a bio acoustics model meant for interpreting and creating embeddings for lung sounds, coughs, sneezes, coughs,
4:484 minutes, 48 secondssneezes and so on which can be used to help with diagnostics for uh lung diseases. We also have a few legacy
4:564 minutes, 56 secondsimage encoders on the right side of the screen that I won't be talking about.
5:015 minutes, 1 secondSo I want to focus the rest of the talk on medgeemma. Medgema is built on Google's open uh general purpose model
5:095 minutes, 9 secondsGemma and it's Google's most capable open model for medical text and image comprehension.
5:175 minutes, 17 secondsThe Medgema collection consists of several different models each with different uh applications and strengths.
5:245 minutes, 24 secondsSo uh on the left side of the screen you'll see three different models. Medma 1.5 which is available in a 4 billion parameter version. than the original
5:335 minutes, 33 secondsMedeMema which is available in a 27 billion parameter version and also a smaller version that is essentially superseded by MedGema 1.5. So we focus
5:415 minutes, 41 secondson the 27b version of that as well as the medigip image encoder which is 400 million parameters or 0.4 billion. All
5:505 minutes, 50 secondsof these different models are really useful for interpreting two-dimensional medical imaging and in particular hystopathology, dermatology,
5:585 minutes, 58 secondsopthalmology, retinal fundus images and radiology. And then the LLM versions of the models, the medgeema models are also
6:066 minutes, 6 secondsreally useful for medical text and medical records. They can be prompted via speech by leveraging med ASR to
6:146 minutes, 14 secondsconvert speech to text. And then in particular, MEGMA 1.5, our more recent model, is uh optimized also for advanced
6:226 minutes, 22 secondsmedical imaging, including multi-timepoint radiology, so multiple images of a patient over time, threedimensional radiology like uh CT
6:306 minutes, 30 secondsand MRI scans, whole slide pathology, that is interpreting an entire slide, a gig gigapixel slide uh all at once, as
6:386 minutes, 38 secondswell as anatomical localization, in particular in chest X-rays.
6:436 minutes, 43 secondsSo one way to interpret this uh portfolio of models is that the medgema 1.5 model the 4 billion parameter model
6:516 minutes, 51 secondsis small efficient and has these additional uh elements of optimization for advanced imaging and the original medgeema is really the best choice for
7:007 minutestext as long as you have the resources to run it. It's a bit more expensive to do so. And then finally mediglip is optimized again for classification or
7:087 minutes, 8 secondsimage retrieval but it's not a generative model.
7:137 minutes, 13 secondsSo just to give an example of how Medgema can be used as a solid starting point and what its capabilities are, this is one example of out of the box
7:227 minutes, 22 secondsusage of Medgema interpreting a pair of chest X-rays. Uh this is a longitudinal pair that I alluded to before. So uh
7:297 minutes, 29 secondsit's interpretation of a current X-ray in the context of an earlier X-ray of the same patient. So in this case the
7:367 minutes, 36 secondstwo x-rays are provided to medema and the prompt is to compare the two above images and is the pneumonia unchanged
7:447 minutes, 44 secondsworsened or improved in the second image compared to the first image. I won't read the full AI response but the main point is that it noted that the
7:527 minutes, 52 secondspneumonia appears to have worsened in this case and then we also reviewed that response as well as the original images with a board-certified thoracic
8:008 minutesradiologist who agreed that the pneumonia is worsened. So it got the broad strokes of the question correct but then also noted that there is a
8:078 minutes, 7 secondsregion of relative lucency in the midright lung uh we're um reading off the right side here that could res represents either cavitation or merely a region of lungs spared by pneumonia.
8:178 minutes, 17 seconds[snorts] So the interpretation by the radiologist indicates that in a broad stroke it it gets the question correct
8:258 minutes, 25 secondsbut there's still room for improvement and as we note in the lower right down here fine-tuning may improve results which is an important point where we
8:338 minutes, 33 secondsconsider MedGema to be a good starting point for medical modeling but it's not intended to be used for clinical diagnosis or management out of the box.
8:418 minutes, 41 secondsIt's meant to be fine-tuned and adapted by thirdparty users when building their own medical AI applications and then evaluated in their particular use cases.
8:508 minutes, 50 secondsI'll give this one additional example.
8:528 minutes, 52 secondsThis is a a a capability that we also added in Medgema 1.5 of analyzing volutric CT images where given a CT
9:019 minutes, 1 secondvolume here just we're showing three slices of a CT volume but the entire volume is provided and the tool is asked to analyze this contiguous block of CT
9:099 minutes, 9 secondsslices and given that the patient is being evaluated for liver tumors are there any evidence of tumors in the liver again the model says there is
9:179 minutes, 17 secondsevidence of a larger regular mass in the right lobe of the liver and gives additional context we also had this reviewed by board-certified thoracic radiologist who agreed with the
9:259 minutes, 25 secondsassessment however noted that one of the findings by MedeMema appeared to be spurious. There wasn't this secondary finding that Medma indicated again
9:349 minutes, 34 secondshighlighting that Medma is a solid starting point but is not intended to be used out of the box. It's intended to be adapted by users.
9:439 minutes, 43 secondsSo this is the uh quintessential workflow that we expect developers to be following when using Medma for their applications. They'll initially be
9:529 minutes, 52 secondsdefining a use case, then identifying the right model for their use case via that model picker graphic that I showed earlier. They'll also, and this is
9:599 minutes, 59 secondscritical, define the appropriate evaluation for their use case. Something that is evaluating their systems intended use and in the context of the
10:0710 minutes, 7 secondspatient population that they'll be working with. They'll measure baseline performance with the the medgeema model or whatever the model is they choose to
10:1410 minutes, 14 secondsstart with. And then critically they'll spend most of their time in this adapt adaptation and tuning loop with evaluation making modifications, running
10:2210 minutes, 22 secondsnew experiments, maybe modifying their data until they achieve a result that they find meets the needs of their application. And at that point, we make
10:3110 minutes, 31 secondsit very easy with our cloud partners to scale the application to run it live on Google Cloud. Uh so that you don't need to worry about managing all of that inference and infrastructure yourself.
10:4610 minutes, 46 secondsSo as I mentioned before besides actually providing the models with these base capabilities we do a lot to provide enabling tools to help people use the
10:5410 minutes, 54 secondsmodels and deploy the models. So for questions that users may have like I wonder how this model does on my data
11:0311 minutes, 3 secondsresults but every individual application's data is going to be somewhat different. It could be a different kind of data. It could just be a different patient population. So we
11:1211 minutes, 12 secondsprovide uh example notebooks on both hugging face and uh on model garden for how to actually run the model and then
11:2011 minutes, 20 secondsevaluate results on your own data. You may ask how can I change the model and adapt it for my use case if my initial evaluation is not satisfactory. So we
11:2911 minutes, 29 secondsprovide example notebooks for how to fine-tune the model using Google cloud.
11:3411 minutes, 34 secondsuh once you've actually tuned the model and want to deploy it or even if you want to deploy it uh to evaluate it, we provide example uh use cases for how to
11:4311 minutes, 43 secondsturn it into an API and deploy it via both hugging face and vertex AI. And then we also provide a few example demo
11:5011 minutes, 50 secondsapplications to just give you uh both some inspiration for what you can build with the model but also to show uh we we provide the code for those demo
11:5811 minutes, 58 secondsapplications. So you can actually see the inner workings of how one might orchestrate medema into a larger application
12:0612 minutes, 6 secondsand those are also available by our hugging face collection.
12:1212 minutes, 12 secondsSo uh a question that we very often are asked is what is the practical difference between Gemini and Medgema?
12:1912 minutes, 19 secondsWhy would I choose one over the other?
12:2112 minutes, 21 secondsAnd in general, Gemini will provide greater convenience and in many cases but not all improved performance. Uh the
12:2912 minutes, 29 secondsconvenience because there is no need to uh host the model for example. Uh there are APIs for fine-tuning it and so on.
12:3612 minutes, 36 secondsSo uh and then I'll also say that uh for control medgeemma provides u a more rich experience. So the bottom line here in
12:4512 minutes, 45 secondsmost cases is if gemini works for your use case gemini is probably preferred due to its convenience and potential uh
12:5212 minutes, 52 secondsimproved performance although the performance is worth comparing. If however you need full control over the models which is true for a lot of the users we talk to because they are in
13:0113 minutes, 1 secondsovereign nations and don't want to have this dependence on infrastructure based in the US or they want to own all the IP uh of what they're doing in a very clear
13:1013 minutes, 10 secondsway and so on or they want to work offline where these closed models like Gemini are not available then Medma
13:1813 minutes, 18 secondsprovides essentially the only experience that would work for them. So it kind of meets the those types of users where they are.
13:2513 minutes, 25 secondsto go into a little bit more detail here. Compared to Gemini, Medgema will provide a superior or a preferred experience in a few different cases
13:3413 minutes, 34 secondswhere IP ownership of the model is necessary where you're working on medical imaging use cases where Medjma has been specifically tuned and uh
13:4113 minutes, 41 secondsgenerally achieve state-of-the-art performance where you need to substantially adapt the models beyond what's possible via existing Gemini
13:4813 minutes, 48 secondstuning APIs or you want to create a medical device. This is uh totally within the bounds of the license for Medgema. You can create a medical device
13:5713 minutes, 57 secondsbased on Medgema. If you need the devices uh sorry the your data to stay on device or in a private TCP environment or you need to run offline
14:0614 minutes, 6 secondsuh Medma provides that opportunity via its openness. And then finally Medgema allows you to take full control over the
14:1314 minutes, 13 secondsinference pipeline rather rather than relying on an API. So for example, if you're running uh an inference system
14:2114 minutes, 21 secondsmaybe on an edge device for example and you want to have full control over those costs that's possible with open models not as straightforward with closed
14:2914 minutes, 29 secondsmodels like Gemini again in many cases Gemini will be a preferred choice for medical applications but when it's not possible Medma is there to fill that gap.
14:4114 minutes, 41 secondsWe provide many different resources so you can learn more about Medjema, its strengths, um what we've tested it on and get a feel for whether your
14:4914 minutes, 49 secondsapplication is in or out of distribution for what we've optimized it for. Our main site is this one over here, go.glehide.
14:5814 minutes, 58 secondsUm and on that site, you'll find our model cards that detail both the how the model was trained and also how it was evaluated and the training data that was
15:0715 minutes, 7 secondsused in the model. Uh and also very critically our intended use statement which is you know intended use is not
15:1415 minutes, 14 secondssuper exciting but it's an emphasis that we intend for this model to be adapted by the users not to be used out of the box and that's where you're going to
15:2215 minutes, 22 secondsfind the best performance with the models.
15:2615 minutes, 26 secondsBeyond the model cards which are fairly straightforward basic information, we also have provided technical reports on
15:3415 minutes, 34 secondsarchive for both the original Medma model developed and released in mid 2025 as well as MedGema 1.5 which was
15:4215 minutes, 42 secondsreleased earlier this year. Tech reports are available for both of those and they go into much more detail about how the models were developed and how they were
15:5015 minutes, 50 secondsevaluated so you can get a better feel for how they may work in your use case.
15:5815 minutes, 58 secondsBeyond the uh the tools we provide and infrastructure as well as these uh the technical documentation, we also provide
16:0716 minutes, 7 secondsdemo applications which I which I mentioned before that show you how you can orchestrate Medma into a larger application.
16:1516 minutes, 15 secondsSo the uh first app this these are all available on you can use this QR code.
16:2016 minutes, 20 secondsThey're also available in our hugging face collection. The first demo application shows how Medgema can be used to interact with electronic health
16:2716 minutes, 27 secondsrecords through fire. So with a a broad query about some information about a patient, Medma can be orchestrated to
16:3616 minutes, 36 secondsaccess the medical record uh through fire or through other uh systems, get information and return it to answer that query.
16:4516 minutes, 45 secondsAnother demo we provide is this one for understanding a radiology report. So uh
16:5416 minutes, 54 secondsgiven an existing radiology report provided by the radiologist Gemma can be used uh in in a consumerf facing
17:0117 minutes, 1 secondapplication to explain the meaning behind the different aspects in the radiology report.
17:0817 minutes, 8 secondsA third one simulates the pre-in previsit intake that a patient may go through before having a visit with their
17:1617 minutes, 16 secondsprovider. So this is an intake form where traditionally this is done um uh on a written piece of paper. More recently it's a set of maybe 10 or 20
17:2517 minutes, 25 secondsquestions that the patient will fill out electronically.
17:2917 minutes, 29 secondsThis demo shows how one can make an adaptive patient intake process where uh questions are asked using medema as the
17:3717 minutes, 37 secondsthe the thinking basis behind which questions are relevant and it will adapt and ask relevant questions for the
17:4517 minutes, 45 secondspatients symptoms medical history and so on as well as providing a basic uh report about the patient that the
17:5317 minutes, 53 secondsprovider can then review prior to the visit. So we have a demo showing that process. And then finally we have one
18:0018 minutesthat is focused on radiology similarly to demo two where the uh user can
18:0718 minutes, 7 secondsprovide radiology image and then they are quizzed on different aspects and and findings within the radiology image
18:1418 minutes, 14 secondshighlighting how a tool like MedGema can be used for general clinical training applications.
18:2018 minutes, 20 secondsAll of these are just demos. They're not full applications meant to just show some of the possibilities of what you can do with Medgema. And of course, you can view these on high on hugging face.
18:2918 minutes, 29 secondsYou can review the code and then take inspiration and maybe even take pieces of the code although generally not the full applications with have mock the
18:3718 minutes, 37 secondsapplications have mocks and so on. So you wouldn't necessarily copy paste the code but you can take pieces of the code and potentially use them in your own application.
18:4818 minutes, 48 secondsuh we have a lot of third parties that have the whole point of high def is for third parties to use it and build
18:5518 minutes, 55 secondsmedical applications to to solve their particular healthcare problems they're focusing on and we have many third parties that have done this already since our initial release in 2025.
19:0619 minutes, 6 secondsThe Ministry of Health of Taiwan has used Medgema to uh do a pre-operative assessment of lung cancer surgery
19:1519 minutes, 15 secondscandidates patients to both uh optimize patient outcomes and then also in aggregate to inform public policy about
19:2319 minutes, 23 secondshow these patients are treated and and the optimal treatments for the patients.
19:2819 minutes, 28 secondsThe Ministry of Health of India is working with different organizations within India to build foundation models
19:3519 minutes, 35 secondsfor India optimized both for the Indian languages as well as for clinical guidelines and best practices within India.
19:4419 minutes, 44 secondsMinistry of Health of Singapore is also using Medma to build localized sovereign multimodal foundation models for primary
19:5219 minutes, 52 secondscare sort of general triage and simple use cases as well as in specialty settings and these are in different uh
19:5919 minutes, 59 secondsarea um different steps in clinical validation or active development.
20:0620 minutes, 6 secondsIn addition, many different health tech startups, especially outside the US, have used MedeMema for various different applications. In Malaysia, QMED Asia has
20:1520 minutes, 15 secondsbuilt a conversational interface to uh be a front end to their clinical guidelines using Medma to interpret uh
20:2320 minutes, 23 secondsthe guidelines via retrieval augmented generation. Uh within Uganda, Crane AI has used MedeMema for mobile
20:3120 minutes, 31 secondsapplications to support maternal health uh via community health workers. And in Zambia, Dawa Health has used Medma via
20:4020 minutes, 40 secondsits multimodal capabilities for cervical cancer screening.
20:4420 minutes, 44 secondsAnd I'll just reemphasize that in all these cases, Medma is used as a foundation model, then adapted and evaluated on these specific use cases, not used out of the box.
20:5520 minutes, 55 secondsWe have a public showcase uh online uh you can go to that high def site that I mentioned earlier go.glehide
21:0321 minutes, 3 secondsand see the showcase where we have in-depth case studies from different users of Medgema to show what their experience has been and how they've used
21:1021 minutes, 10 secondsit as well as uh details about which different infrastructure they use what cloud services were relevant to them and
21:1821 minutes, 18 secondsso on. Uh if anyone in this audience ever develops something with Medgema, we would love to feature your work on the showcase. So please do get in touch with
21:2721 minutes, 27 secondsus or if you've already used it, of course, get in touch.
21:3121 minutes, 31 secondsUh those are all the slides I wanted to share. Here's a lot of QR codes for people who like QR codes and I really appreciate your attention and I'll turn it back over to Joe.
21:4121 minutes, 41 secondsWonderful.
21:4321 minutes, 43 secondsThanks so much, Dan. Thank you. Uh that was that was fantastic. particularly the the walkthrough on the technical frameworks and architectural insights
21:5121 minutes, 51 secondsthat you shared that was really invaluable. Um what really stood out to me from today's talk is that turning these complex healthcare and life
21:5921 minutes, 59 secondsscience breakthroughs into reliable production systems isn't just about choosing a particular algorithm or model
22:0622 minutes, 6 secondsin the process. It's about architecting for scale, taking governance into account and the long-term defensibility
22:1322 minutes, 13 secondsright from that prototype stage. Um, our team, I should say, has been actively curating your questions. Thanks everybody for engaging throughout the
22:2122 minutes, 21 secondstalk. While Dan steps away for just a second to review some of those questions, take a B. Um, I'm going to do uh just highlight a couple things that I
22:2922 minutes, 29 secondsthink are worth mentioning regarding our uh our programs for working with startups in particular.
22:3622 minutes, 36 secondsUm so you know to stay connected with everything that's happening across the whole ecosystem um please make sure to
22:4422 minutes, 44 secondsbookmark the startup's digital hub as a follow-up here. You see the QR code there you can think of this as like your one-stop shop a central hub for
22:5322 minutes, 53 secondstechnical webinars things like this uh hands-on architectural workshops startup programs um you know really anything and
23:0123 minutes, 1 secondeverything. this is your this is the place that you go. Um through that hub you're going to tap directly into key industry events and webinars um focused
23:1023 minutes, 10 secondson emerging technology frontier markets not just healthcare but sort of generally um direct engagement with Google cloud technical experts that's
23:1723 minutes, 17 secondsone of the most common things that I get asked on the BD side is how do you get in touch with with the folks that really know this technology inside and out um
23:2623 minutes, 26 secondsand that's how you get this the support for your own architectures and work and then real world case studies. So particularly in healthcare but across
23:3323 minutes, 33 secondsthese industries, it's not just diagrams and and slides, but actually how do you deliver and build these things in real time. So case studies showing you the
23:4223 minutes, 42 secondsexact blueprints and success stories of leading startups showing how they've built for scale.
23:4923 minutes, 49 secondsAnd then then finally here the cloud program itself. So for founders looking to protect their runway while building um on our top tier infrastructure, we
23:5723 minutes, 57 secondshave the Google for startups cloud program. eligible startups, and there are some some nuances to this that you'll see, um can access up to $350,000
24:0624 minutes, 6 secondsof US dollars um in Google Cloud credits. Um there are companywide discounts um across Google, direct access to build with the exact same
24:1524 minutes, 15 secondsmodels and infrastructure that power Google's core products. Um and uh um exclusive partner discounts and perks
24:2324 minutes, 23 secondsalong the way. So you can apply directly o online and reach out to our team to explore your eligibility for these
24:3024 minutes, 30 secondsprograms and remember that with that Google for startups cloud program you get access
24:3724 minutes, 37 secondsnot only to cloud credits but also the vast network of our partners um exclusive perks really are available for
24:4424 minutes, 44 secondsyou and your team as you join that program and and continue to build at scale. Um, so thanks for for for uh uh
24:5324 minutes, 53 secondsindulging there in that part and be sure to bookmark those sites. Um, I'm going to bring Dan back on now just to um go
25:0125 minutes, 1 secondthrough a couple of the questions um that we um that we talked about. So Dan, thanks. Welcome back. Um, one one
25:0825 minutes, 8 secondsquestion we had was are there any real world examples of uh Medma being used or
25:1525 minutes, 15 secondsembedded into the NHS um and existing software? So MS uh uh things like that.
25:2325 minutes, 23 secondsYeah, we we as I mentioned before we have a lot of collaborations with with governments outside the US. We have had
25:3225 minutes, 32 secondsother research that we've done in collaboration with NHS. We've had uh some research on mimography screening that was published earlier this year
25:4025 minutes, 40 secondswith the NHS. We have not to date engaged with the NHS on integration of medema into their systems yet. Uh, of
25:4825 minutes, 48 secondscourse, if there's anyone from the NHS who's interested in that, we would love to talk to them, but the NHS is one that we have not yet engaged with to my knowledge.
25:5625 minutes, 56 secondsAnd we didn't talk about it this time, but I, you know, I spent my own career in in clinical medicine. I was a surgeon many years ago before making the jump
26:0326 minutes, 3 secondsover to the technology side. And I know HIPPA and patient protection, protection of P, PHI, and patient data is really
26:1026 minutes, 10 secondscrucial. What are some of the HIPPA guard rails um that you take into account when building with this? And then like is there a documentation on
26:1826 minutes, 18 secondsthat? Um because I know that folks always want to make sure that they're they're covered all around.
26:2326 minutes, 23 secondsYeah, that's a great question. I one of the big advantages when it comes to patient privacy and I agree patient privacy is a very very important concern
26:3126 minutes, 31 secondsand something we have to really be very cautious of and intentional about when building medical applications. One of the big advantages of open models like
26:3826 minutes, 38 secondsMedgema is that they are uh these are binary models that you download and you deploy in the system that works best for
26:4626 minutes, 46 secondsyou. These are not API based models. So, Medma is not an API to which you will send data and then have some concerns or
26:5326 minutes, 53 secondsquestions about HIPPA. It is is something you download and then you can deploy on your own infrastructure. So you can deploy this locally within on
27:0127 minutes, 1 secondpremise in the hospital in which case no data ever leaves the hospital or you can work with Google Google cloud's many HIPPA compliant services virtual
27:1027 minutes, 10 secondsmachines and the like and feel comfortable comfortable by virtue of those guarantees that if you deploy Medma there it will also be HIPPA
27:1827 minutes, 18 secondscompliant. So med that system not medma models don't get h compliant systems are hypoaco compliant or not and so this
27:2727 minutes, 27 secondsflexibility allows you to deploy medema into the hippaco compliant environment of your choice and uh kind of reduces
27:3627 minutes, 36 secondsthat risk of sending data to the model where you're not sure where it's going because you have the full control.
27:4227 minutes, 42 secondsUm and one other question we had was about updates. Is there going to be a um a an update similar to that we see across Gemini? Is there a Gemma 4 um update coming from May?
27:5327 minutes, 53 secondsThat's a it's a great question. It's one of our most popular questions. Uh absolutely. It is something we're actively working on and we hope to be able to announce something this year.
28:0228 minutes, 2 secondsOkay, great. Stay tuned. Stay tuned. Um a specific question here on the Medgema 4B. Um we have a team from an Indonesian
28:1228 minutes, 12 secondsclinical documentation startup. um that the the base is multilingual and the grammar was fluent when they built with
28:1928 minutes, 19 secondsthis. Um but some of the medical vocabulary felt slightly off. They were, you know, asking for one result, they got another that was very different. Um
28:2828 minutes, 28 secondsthe question is medically tuning the language. It seems really Englishheavy.
28:3228 minutes, 32 secondsUm and is there any of the domain tuning to um non-English settings? Like how do you think about language particularly as it relates to medical language here?
28:4128 minutes, 41 secondsYeah, it's a great question. It's it is um an unfortunate limitation of a lot of AI development these days that the
28:4928 minutes, 49 secondsmajority of available data is in English and especially because we have a lot of partners who partners and users who use
28:5828 minutes, 58 secondsMedGema outside the US we definitely recognize this as a limitation. So I'll say two things there which is for the
29:0629 minutes, 6 secondscurrent generation of models we have seen users have success fine-tuning the models on medical data sets in their
29:1329 minutes, 13 secondslocal languages and allowing it to be adapted there because the fundamental medical concepts are built into the model and it's really just this language
29:2229 minutes, 22 secondslayer which is not a literal layer but you know conceptually layer within the model that needs to be tuned. So tuning
29:2829 minutes, 28 secondson local language data, we've seen people have good results with that. With that said, we definitely recognize that
29:3629 minutes, 36 secondsusers who are using Medma in languages other than English could use some additional support assistance tools and so on. So we're actively working on
29:4429 minutes, 44 secondsdeveloping uh those kinds of tools, thinking about it, ideulating about it uh that will help users adapt MedGema,
29:5129 minutes, 51 secondsboth current and future versions to different languages. Um, so if if you have ideas on how to do that or if you have feedback on how uh it's not working
30:0030 minutesright now, we'd love to hear more from you and work with you on that.
30:0330 minutes, 3 secondsThat's great. Um, sort of a similar vein about um the way multimodal data comes
30:1030 minutes, 10 secondsin. Um, there's a team here working with medical video data sets. Um, and is there a way to leverage the Gemma family of models best in that kind of setting?
30:2030 minutes, 20 secondsYeah. Uh so one sort of um distinction between medical video versus other types
30:2730 minutes, 27 secondsof medical imaging like radiology is that these are RGB sort of visible light images typically and that means that the
30:3630 minutes, 36 secondsdomain of medical video tends to be a little bit closer to the domain that the original Gemma and Gemini models were trained on compared to X-rays for
30:4430 minutes, 44 secondsexample which are quite different because they're high bit depth data they're different uh dimensions
30:5130 minutes, 51 secondsand so on. So what that means is uh the even though we have not tuned medema specifically on medical video and that
30:5930 minutes, 59 secondscould include surgical videos for example or even videos of um individuals undergoing uh physical exams for example
31:0631 minutes, 6 secondsin a primary care setting. We expect that with some light tuning you can probably achieve pretty good results uh
31:1431 minutes, 14 secondswhere just because the the RGB nature of the images is similar and that tuning can involve uh different frames of the video
31:2231 minutes, 22 secondsbeing passed in uh together into the prompt. With that said there uh there are some things we're working on related
31:3031 minutes, 30 secondsto surgical video especially that we hope to release in future versions of Medma. So we expect that future versions will provide even uh better foundations
31:3931 minutes, 39 secondsfor medical video especially surgical video but I think you can find you can get pretty good results even today with the current models uh with some fine-tuning on the domain of interest.
31:5031 minutes, 50 secondsThat's great. Um this is this next one I I I love because I think it it touches on so many elements of how folks are currently using uh Medma but also
31:5931 minutes, 59 secondsGemini. So, so there's a group that already has Gemini running uh within the production healthcare workflow that they
32:0632 minutes, 6 secondshave and they want to add Medge Gemma, but they don't want it to replace Gemini in the process. They want to use the right model at the right time for the
32:1332 minutes, 13 secondsright task, which is which is great. um what architecture um is currently recommended for integrating MedGeemma
32:2132 minutes, 21 secondsalongside Gemini on Google Cloud and that includes model routing, deployment, data and PHI boundaries, evaluation,
32:2932 minutes, 29 secondsclinical safety, the whole range. Um, and the goal here is that so that Medgema can handle the specialized
32:3732 minutes, 37 secondsmedical reasoning or multimodal workloads while Gemini continues handling the general AI work and patient
32:4532 minutes, 45 secondsfacing workflows. Is there like how should they be thinking about that and what are the best ways to sort of tee that up?
32:5132 minutes, 51 secondsYeah, for that kind of application it depends on uh specifically why you're considering adding medema. So there's probably I would say two big reasons.
33:0033 minutesNumber one is for the specific use cases that where Medge Gemma may provide a better result than Gemini and for that I
33:0833 minutes, 8 secondsthink um clinical medical imaging is the main one that comes to mind uh like radiology in general probably Gemini
33:1633 minutes, 16 secondswill provide a better result for medical text um so if you're using MedMe as a tool probably clinical radiology or some
33:2433 minutes, 24 secondsother kind of um specific medical imaging would be the the reason another reason you might orchestrate them together is to provide a layer of
33:3233 minutes, 32 secondsabstraction where uh in infrastructure you control any personal health information is seen only by medgeemma
33:4033 minutes, 40 secondsthrough your infrastructure in a way you can control in with full HIPPA compliance and then you can send then
33:4733 minutes, 47 secondsthe deidentified data maybe that's an output of medgema to Gemini with that said I want to emphasize that um with the right orchestration Gemini can also
33:5533 minutes, 55 secondsbe hipaco compliant so from a strictly legal perspective you can use Gemini for that end to end, but some organizations may just have greater comfort knowing
34:0434 minutes, 4 secondsthat they have full control of the data for for privacy. So, how you actually orchestrate them together really depends on the use case and why you're using it.
34:1434 minutes, 14 secondsIn general, I would say if it's the first case where you're using it as a tool for medical imaging, say, then the
34:2234 minutes, 22 secondsGemini would provide a front end and then it can farm out to Medjema as a tool when a medical image is provided. I
34:3034 minutes, 30 secondsunfortunately I I can only speak in the abstract for that because we're mostly in the business of providing the the foundation models and so on. we are not
34:3734 minutes, 37 secondsas involved in the actual orchestration of applications but your you know cloud service provider and your your contact at cloud can can give you more
34:4534 minutes, 45 secondsinformation and provide and connect you to customer engineers for how to orchestrate things together.
34:5034 minutes, 50 secondsUm the first one about uh providing an abstraction layer for personal health information that gets more complicated I probably it's probably better for me not
34:5934 minutes, 59 secondsto pontificate about that because I don't know how useful it would be.
35:0235 minutes, 2 secondsSuffice [snorts] to say, talk to your um customer engineer and cloud representative for feedback, but you can also get in touch with us either through
35:1035 minutes, 10 secondsour forum. Uh we have a forum linked through our website or we have a feedback forum or your customer engineer can contact us for more information. So,
35:1735 minutes, 17 secondsI think that's the best way to get that information.
35:1935 minutes, 19 secondsGreat. Yeah, makes total sense. Um this is this is another good one. These are great questions. very nuanced and clearly folks are digging into these
35:2835 minutes, 28 secondsmodels and and really you know seeing pressing the limits if you will. Um so what are the current recommendations for
35:3535 minutes, 35 secondsbest practice for quantizing and running lightweight variants of Medgema locally on lowcost edge hardware? This is in a a
35:4435 minutes, 44 secondsrural healthcare setting. Um and before then syncing telemetry back to Google Cloud or Vertex AI or other or other
35:5135 minutes, 51 secondsareas of connectivity. what's the what's the best practice recommendation there?
35:5535 minutes, 55 secondsOkay, there I think there are two two questions in there about actual deployments on edge hardware and then telemetry.
36:0136 minutes, 1 seconduh I I'll focus on the first one to start which is um so for for quantization we for for the existing
36:1036 minutes, 10 secondsmedgema checkpoints especially medgeema 1.5 which is our latest smaller model 4B we don't provide a quantization aware
36:1736 minutes, 17 secondstraining checkpoint which means that after quantization there will be some reduction in performance but we found in our experiments depending on the benchmark it's on the order of 5%. you
36:2636 minutes, 26 secondsknow, maybe you'd prefer 0% of course, but 5% is not too bad and especially after fine-tuning, you can probably recover that performance. So, we don't
36:3436 minutes, 34 secondshave official quantized checkpoints for Med Gemma, but I know some third parties, especially Unsloth, for example, have provided quantized
36:4336 minutes, 43 secondsversions of those models. So, that would [snorts] be your best bet for an off-the-shelf quantized version of the model. With that said, for the next
36:5136 minutes, 51 secondsversion of Magma again, which I we hoping to release this year, we are hoping to release quantization aware
36:5836 minutes, 58 secondstraining versions. So that will uh result in improved performance after quantization as well as our own firstparty quantized versions of the
37:0637 minutes, 6 secondsmodels and instructions for how to quantize on your own. If for example, you take the original full precision models, fine-tune and then quantize, we
37:1437 minutes, 14 secondscan provide instructions for that. So, we're we're hoping to provide that and and essenti essentially address this
37:2137 minutes, 21 secondsfeedback about how to best quantize and deploy on mobile or on um local machines like laptops with our next release. And
37:3037 minutes, 30 secondsalso we hope in the future uh I do hope this year again no promises about any of this lots of lots of things can happen but we hope to release a smaller model
37:3937 minutes, 39 secondsbased on Gemma 2 uh Gemma 4 2b uh so that would be even more amendable to deployment on smaller mobile devices.
37:4937 minutes, 49 secondsUm, suffice to say, you have some options now via third party quantized versions of the models and this is feedback we've heard a lot. So, we're
37:5737 minutes, 57 secondsworking on improving the experience for the next uh versions of our models. Wonderful. Yeah, sorry. Go ahead.
38:0238 minutes, 2 secondsI didn't answer the second part of the question. Uh, it is probably one that I may not be able to answer, but if if you don't mind repeating it quickly, Joe, I can see if I can address it at all.
38:1038 minutes, 10 secondsYeah, it was a question about um syncing telemetry back to the cloud or Vert.ex X AI when so when you're at a so they're
38:1838 minutes, 18 secondsworking on an edge on an edge hardware and then sort of syncing back once they have connectivity again.
38:2438 minutes, 24 secondsOkay, that one is probably outside of our area of expertise. So I would talk to your uh cloud representative for suggestions on that.
38:3038 minutes, 30 secondsGot it. Um so here's another specific use case. Um folks that are somebody's using Gemini right now um to work with
38:3938 minutes, 39 secondsuh non-verbal and neurode divergent um folks um living with dementia PTSD.
38:4538 minutes, 45 secondsthey're already using Gemini in that process.
38:4738 minutes, 47 secondsUm the question is if they fine-tune Medma inside of their own architecture and later build a medical device on top
38:5538 minutes, 55 secondsof it, what are our and you can speak abstractly about this. I don't want you to I'm not asking you to to talk specifically about their case, but what
39:0239 minutes, 2 secondsdo we recommend right now for validation and FDA submission in that setting? um if you're embedding Medge Gemma and then
39:1139 minutes, 11 secondsum the a follow-up question is that they want to know if they can keep Med Gemma on premise for patient data while using Gemini or Vert.Ex AI for the rest of
39:1939 minutes, 19 secondstheir platform with that sort of back to that hybrid setup which you may have touched on. Yeah, this I'll answer in reverse order.
39:2839 minutes, 28 secondsSo yes, Mema can be uh kept on premise and it can handle sensitive things uh and then only say the identified
39:3539 minutes, 35 secondsinformation can be sent externally. So you you'd have your application split up like that. So definitely that's a use case that I think would be very useful
39:4239 minutes, 42 secondsand would encourage for the first part um about how one like what are major considerations for FDA clearance and and
39:5139 minutes, 51 secondsso on. Um it's it's not something that we do not have uh official advice we provide as part of our team for that. I
39:5939 minutes, 59 secondsthink the you know FDA has both the first and the last word on what's required for clearance. things are always evolving. Um, and any kind of
40:0840 minutes, 8 secondsspecific advice I give you would probably go out of date and could turn out to be wrong. Um, just based on my experience now, speaking as a citizen,
40:1640 minutes, 16 secondsnot as the Med Gemma team or Google or so on, one of the most important things you'll need to do besides like tracking how you develop the product and and
40:2540 minutes, 25 secondsdocumentation and so on, is how you evaluate it. And um I won't go off on a on a like tangent about FDA, but they they want to see
40:3340 minutes, 33 secondsthat your application is safe and effective for its intended use and it's not likely to be used outside of its intended use. So if you kind of keep those principles in mind, that will
40:4140 minutes, 41 secondsguide you towards what you actually need to do to ensure that your your system is safe and effective. But I think I'll just stop my speech there because it's a little bit out of my wheelhouse.
40:5240 minutes, 52 secondsYeah, understood. And I think you know it's a it's a common question that we get on the regulatory side which makes total sense and it sounds like we're um
41:0041 minutesthere's no definitive way and a lot of it is sort of a balance between what you're building how you're building it how you're handling your own data and and model structures etc.
41:0841 minutes, 8 secondsUm a question here about um how we've talked a lot about radiology which is sort of a a classic use case for a lot
41:1541 minutes, 15 secondsof this and I think um you focused on this just for example purposes but what about other medical results? So
41:2241 minutes, 22 secondsbiochemistry, pathology, we talked about the imaging piece, um wearables. Um what is how do the open weight models and
41:3041 minutes, 30 secondshigh defaf like treat those and what what's the testing look like there?
41:3441 minutes, 34 secondsYeah, it's a great question. For for the specifics, I'd refer you to our technical reports that are on archive and and probably focus on the
41:4441 minutes, 44 secondsI guess depends on which model you're using, but start with the more recent tech report on Medjma 1.5. We detail fully all the data sets that are used to
41:5241 minutes, 52 secondstrain the model. So you can generally assume that anything that is used to train the model is closer to in distribution. We're going to perform
42:0042 minutesbetter out of the box. You will require less training data and adaptation for your use case. Whereas data sets that are not used to train the model um you
42:0842 minutes, 8 secondsprobably would not get better results with Medgema than you would with the base Gemma for example. So I'll give some concrete examples. We did extensive
42:1742 minutes, 17 secondstraining with chest X-rays, with hystopathology data, both uh individual slices and pole slides, with um
42:2642 minutes, 26 secondsdermatology data and so on. For those use cases, you'll find the mede is a really good starting point and is likely to be the best starting point among open
42:3442 minutes, 34 secondsmodels. We did not yet for the released models uh fine-tune on say surgical
42:4142 minutes, 41 secondsvideos or wearable signals like heart rate pulse oxymmetry and so on or some
42:4942 minutes, 49 secondsother kinds of radiology positron emission tomography and others. So if your use case involves those you may not
42:5642 minutes, 56 secondsnecessarily um get a better experience with medema than you would with Gemma.
43:0143 minutes, 1 secondUh I don't think it's worth going into details of everything that's in and out of scope, but just check out those tech reports with or the model cards which have full details of what we trained on
43:0943 minutes, 9 secondsand that'll tell you where the models provide the best starting point.
43:1343 minutes, 13 secondsAnd and in general, just as a another side note, like that's sort of the one-stop shop for for a lot of these questions, right? In terms of as much
43:2143 minutes, 21 secondsdata as they can get about the the models themselves and how to utilize them. Is that right?
43:2543 minutes, 25 secondsYeah, I'd start with the model cards, which are easier reading. It's very straightforward. Um but the the uh tech reports are also have this data in a
43:3443 minutes, 34 secondstable very easily delineated as well. So probably start with the model cards and if you want more information go for the tech reports.
43:4043 minutes, 40 secondsGot it. Um another sort of language question and I think you you referenced this before um in in some of the opportunities and potential limitations
43:4943 minutes, 49 secondsbut specifically um out of the box use with Spanish as a language. Um is there any divergence there? Are there
43:5743 minutes, 57 secondsrecommended prompting strategies to ensure accurate medical reasoning? Um, consistent Spanish outputs and with like
44:0544 minutes, 5 secondsand and how does pre-training fine-tuning play into that? Just to reiterate that because I also get the language question quite a bit from
44:1344 minutes, 13 secondsum you the term out of the box is slightly triggering to me. So I'll address that first which is again the intended use for Medgema is to be used
44:2044 minutes, 20 secondsuh adapted and then evaluated by users when they're building their medical applications. So it's not intended to be used out of the box for any application
44:2844 minutes, 28 secondsand kind of general clinical reasoning or question answering on Spanish is no exception. So we this is essentially that this sort of
44:3644 minutes, 36 secondsthing um uh out of the box performance on other languages is not something we've extensively evaluated but we have heard from partners that with
44:4544 minutes, 45 secondsfine-tuning on data that's in their language that is aligned with their intended use. So if their intended use
44:5244 minutes, 52 secondsis as kind of a medical triage chatbot then they would have examples of question like medical questions that that consumers might ask for example and
45:0145 minutes, 1 secondthen the appropriate responses in their language. Um if you have that and you fine-tune on that uh you can do it simply with with Laura Qura or you can
45:1045 minutes, 10 secondsdo more complex full fine-tuning depending on the on the use case. Uh we've found that users have gotten good results in that use case. So I do not I
45:1945 minutes, 19 secondswouldn't give a prompting strategy to get the model to work well on Spanish.
45:2345 minutes, 23 secondsNot only because out of the box use case uh is not really is not what we're encouraging but also because I think you'll get much better results with
45:3145 minutes, 31 secondsfine-tuning and it would behoove anyone building an application to have collected some data both to use for
45:3845 minutes, 38 secondsevaluation of course because you need to know how well it works but also take a subset of that data and use it for training or tuning.
45:4445 minutes, 44 secondsMakes sense. um any specific use cases around clinical trial workflows um accelerating trials
45:5345 minutes, 53 secondsanything to to highlight or places to point people for case studies in that area.
46:0046 minutesUm I think maybe the one I I don't think that the use cases are I mean there are different use cases but a lot of the
46:0846 minutes, 8 secondsthings that one needs to do are fundamentally similar to standard clinical use cases which is what we've optimized for. There can be reading
46:1446 minutes, 14 secondsradiology reports. Um there can be um assessing symptoms and that kind of thing. So I think there's a lot of
46:2246 minutes, 22 secondsoverlap with clinical medicine which is what we've we've optimized it for. The one thing I will say is that the um the
46:3146 minutes, 31 secondsway essentially for the use case you you still want to tune it. Um but then also
46:3846 minutes, 38 secondsthe models have been optimized for clinical medicine. They have not been optimized as much for scientific
46:4746 minutes, 47 secondsresearch and discovery. And so what that practically means is when there are clinical aspects of the study like I mentioned before reading radiology or
46:5546 minutes, 55 secondsradiology images as an example the models can be used very well for that.
46:5946 minutes, 59 secondsAgain fine-tuning will get you the best results. If it is more about interpreting novel findings from the
47:0747 minutes, 7 secondsclinical trial and what are the implications the model hasn't really been tuned on that I don't expect it necessarily to do better than the base gema models.
47:1547 minutes, 15 secondsGot it. So it's a question of the way you're using it in that study. Not necessarily sort of a blanket study
47:2347 minutes, 23 secondsapproach or trial approach in and of itself. That makes yeah that makes sense. And it seems to be sort of a theme running through this, right? Like this is sort of built to customize, built to fine-tune, just as you said.
47:3347 minutes, 33 secondsAnd so take it with that spirit. This is not um and could you just give like a a quick head-to-head in some of these
47:4247 minutes, 42 secondsscenarios with something like Gemini? We talked about it before, but I think reiterating that where like the key difference for something like that is if
47:4947 minutes, 49 secondsyou're trying to do task X, then maybe Gemini is a better approach or or one of those type of models versus something that you're fine-tuning and and reworking yourself.
47:5847 minutes, 58 secondsYeah. I um I think it in general if if the operational elements of Gemini work
48:0748 minutes, 7 secondsfor you, you can work online. You're willing to pay per inference call like you know per token or whatever and um
48:1648 minutes, 16 secondsyou are okay the model will get better over time which is an advantage in most cases but in some cases you really don't want it to change. So as long as you're okay with the model changing over time
48:2548 minutes, 25 secondsyou know the old Gemini will get deprecated over time and so on. If you're okay with those aspects, I would usually start with Gemini and then
48:3248 minutes, 32 secondspractically I would uh com for for use cases where Gemma or MedeMema may have a better experience. I would just do an
48:4148 minutes, 41 secondsevaluation. You should have evaluation data and just compare them side by side on your use case. Um Medma will again
48:4848 minutes, 48 secondswill be most useful when you cannot accept some of those aspects of Gemini or where the actual performance is better. So for the aspects you should
48:5748 minutes, 57 secondsknow that in advance it needs to run offline or um you need you want to build a medical device then magma is your choice. If it's something where you're
49:0449 minutes, 4 secondsnot sure, um, you want to do it, you want to do chest X-ray report generation pro.
49:2249 minutes, 22 secondsOh, sorry. I think I lost connection for a moment. Did you hear that?
49:2649 minutes, 26 secondsI think I can I can hear you. I can hear you. You were talking about we lost you at at chest X-ray report generation. I think I'm back, but maybe Joe has lost connection.
49:3349 minutes, 33 secondsCan you hear me?
49:4149 minutes, 41 secondsOkay. I think maybe Joe and I lost connection, but I see I'm back and Joe's back. Yeah. Sorry about that. No, no problem.
49:4949 minutes, 49 secondsUm, so can you can you hear me? Yep. Dan. Yeah. Yep.
49:5349 minutes, 53 secondsYeah. Um so um we we um you cut out right as you were saying if you're doing report generation for chest X-rays
50:0150 minutes, 1 secondversus you know the alternative use case there just to close that out.
50:0550 minutes, 5 secondsOkay. In that case if you were going to uh do something like chest X-rays where medma may have an edge I would strongly encourage just doing a sidebyside comparison between
50:1450 minutes, 14 secondsgreat and then last question here. Um these were great questions from the from the audience. Thanks for thanks for putting those in. Um, is there like
50:2250 minutes, 22 secondswhat's your best example of um, MedeMema feeding into a regulatory use case? So
50:3050 minutes, 30 secondssomething that's FDA approved or European regulatory um, approved. Um, is there like a gold standard that you point to? Not that people would, you
50:3850 minutes, 38 secondsknow, use it exactly, but just sort of like, hey, this is how it's worked in that scenario.
50:4350 minutes, 43 secondsYeah, in in AI time scales, we're pretty late in this process. We launched more than a year ago and that's like you know 10 generations of AI in FDA time scales.
50:5350 minutes, 53 secondsWe're quite early in this process. Um I think and regulatory people will know that that often takes um you know years
51:0251 minutes, 2 secondsor so. So we do not have any great examples that we know of yet of uh
51:0951 minutes, 9 secondsindividuals getting FDA FDA or regulatory clearance for their devices.
51:1551 minutes, 15 secondsUm we have we have uh partners who have gotten clearance for earlier generations of
51:2451 minutes, 24 secondsthese models. Not not the generative aspects I don't think. I have to get back to you on that. Um but for um chest X-ray interpretation in the context of
51:3351 minutes, 33 secondsclassification. We have partners who have gotten regulatory clearance for that. The um specifically Nexus AI which is based in South Africa has gotten
51:4251 minutes, 42 secondsclearance for that. I think we're still early in generative AI use cases being used for regulatory applications, but it is a great question and something we're
51:4951 minutes, 49 secondsalways also keeping an eye on and when we have examples that we think really kind of best exemplify that, we'll definitely share them on our site.
51:5851 minutes, 58 secondsDefinitely appreciate the question and also it's it's tough to be a pioneer. I recognize that. But I think there is also a huge opportunity to using these
52:0652 minutes, 6 secondstools for regulated medical devices. So please don't let the lack of precedent be a deterrent. It's a big opportunity.
52:1252 minutes, 12 secondsMaybe maybe one of the folks who joined for this call is going to be that like you know another one of those those use cases. So um thank you thanks um that's
52:2152 minutes, 21 secondsthat's the end of the first session. Uh I want to have a huge thank you to Dan Golden uh for walking us through Medge Gemma showing us how to adapt these open
52:3052 minutes, 30 secondsopen foundation models responsibly for clinical workflows as we talked about.
52:3552 minutes, 35 secondsUm thank you to the audience for the fantastic and thoughtful questions. Um the chat was really um additive and and complimentary to what we worked on here.
52:4452 minutes, 44 secondsUm just one one quick housekeeping note before you log off. Uh please take a moment to fill out the quick survey uh in the window directly to the right of
52:5352 minutes, 53 secondsyour webinar screen. Your feedback really helps uh shape how we do these moving forward. Um this was the first in this series, but we're gonna we're
53:0253 minutes, 2 secondsactually going to do session two right on the back of it. Um so um in about 30 minutes session two on token economics
53:0953 minutes, 9 secondsum uh this is focused on how to beat the cost curve with David White who's one of our founder advocates. We're going to dive into how to rein inference spend
53:1853 minutes, 18 secondshow to keep your infrastructure lean um even as user demand scales. So please tune in for that and uh I'll be there
53:2553 minutes, 25 secondsand we hope to see many of you there too. Thanks again for joining and we will see you at the next session. Thanks again Dan.

