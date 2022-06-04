# Dylan Perlson, Tianxiao Wei API Documentation

The purpose of the API is to be able to support the necessary information that will be posted on both of our stores. This API allows us to retrieve a implified version of all of the elements of the periodic table, as well as a detailed version of a specific element. Furthermore, we implemented the FAQ in this API as well to allower our businessed to not have to store the FAQs on the store website.

## Endpoint 1. Request a list of all the elements

**Request Type:**
GET

**Returned Data Format**:
JSON

**Description:**
This requests a list of all of the elements, along with their atomic number, symbol, and an image related the the element

**Supported Parameters**
No required parameters

**Example Request:**

- localhost:8000/elements

**Example Response:**

```
[
    {
        "name": "Hydrogen",
        "number": 1,
        "symbol": "H",
        "img": "imgs/01.png"
    },
    {
        "name": "Helium",
        "number": 2,
        "symbol": "He",
        "img": "imgs/02.png"
    },
    ...
]
```

**Error Handling:**

- None

## Endpoint 2. Request a specific element

**Request Type**
GET

**Request Format:** localhost:8000/element/:element

**Returned Data Format**: JSON

**Description:** This will request an object that contains detailed information About a specific element

**Supported Parameters** You are able to search for an element using its name, or atomic number. For example, Hydrogen can be search using "1" or "hydrogen"

**Example Request:**
- localhost:8000/element/hydrogen
- localhost:8000/element/1

**Example Response:**

```json
{
  "name": "Hydrogen",
  "appearance": "colorless gas",
  "atomic_mass": 1.008,
  "boil": 20.271,
  "category": "diatomic nonmetal",
  "density": 0.08988,
  "discovered_by": "Henry Cavendish",
  "melt": 13.99,
  "molar_heat": 28.836,
  "named_by": "Antoine Lavoisier",
  "number": 1,
  "period": 1,
  "phase": "Gas",
  "source": "https://en.wikipedia.org/wiki/Hydrogen",
  "spectral_img": "https://en.wikipedia.org/wiki/File:Hydrogen_Spectra.jpg",
  "summary": "Hydrogen is a chemical element with chemical symbol H and atomic number 1. With an atomic weight of 1.00794 u, hydrogen is the lightest element on the periodic table. Its monatomic form (H) is the most abundant chemical substance in the Universe, constituting roughly 75% of all baryonic mass.",
  "symbol": "H",
  "xpos": 1,
  "ypos": 1,
  "shells": [1],
  "electron_configuration": "1s1",
  "electron_configuration_semantic": "1s1",
  "electron_affinity": 72.769,
  "electronegativity_pauling": 2.2,
  "ionization_energies": [1312],
  "cpk-hex": "ffffff",
  "img": "imgs/01.png"
}
```

**Error Handling:**

- 400: Missing required element parameter.
- 400: Element atomic number is out of range.
- 400: Element atomic number is not an integer.

## Endpoint 3. Request the FAQs for the website

**Request Type**
GET

**Request Format:**
localhost:8000/faqs

**Returned Data Format**:
JSON

**Description:**
This request returns the frequently asked questions for the websites that sell elements

**Supported Parameters**
None

**Example Request:**

- localhost:8000/faqs

**Example Response:**

```json
{
  "faqs": [
    {
      "Q": "Where are the elements sourced from?",
      "A": "All elements are locally grown here in Pasadena"
    },
    {
      "Q": "Can I fuse two elements together to create gold?",
      "A": "While technically possible, we currently do not have the technology currently available to do fusion"
    },
    {
      "Q": "How long does it take for elements to arrive?",
      "A": "It can take up to 5 business days for elements to arrive"
    },
    {
      "Q": "Am I able to return my elements for a refund?",
      "A": "Elements are able to be returned for a full refund if returned within 30 days of purchase"
    },
    {
      "Q": "I'm ready to purchase some elements! Where can I do so?",
      "A": "Just head to our main page and we will be able to process your order!"
    }
  ]
}
```

**Error Handling:**
None

## Endpoint 4. Search for elements by specific parameters

**Request Type** GET

**Request Format:** 
localhost:8000/search?attr=ATTRIBUTE&value=VALUE
or 
localhost:8000/search?attr=ATTRIBUTE&value=VALUE1,VALUE2

**Returned Data Format**: JSON

**Description:** This requests the elements name, atomic symbol, atomic number and corresponding images to the elements that satisfy the given parameter

**Supported Parameters** 
Numeric Properties (Optional):
["atomic_mass", "boil", "density", "melt", "molar_heat", "number", "period"];
String Properties  ["name", "appearance", "category", "phase", "symbol"];


**Example Request:**
- localhost:8000/search?attr=boil&value=100

**Example Response:**

```json
[
  { "name": "Krypton", "number": 36, "symbol": "Kr", "img": "imgs/36.png" },
  { "name": "Xenon", "number": 54, "symbol": "Xe", "img": "imgs/54.png" }
]
```

**Error Handling:**

- 400: Missing required value query parameter when attr is passed.
- 400: Missing required attr query parameter when value is passed.
- 400: Attr and value query parameters have mismatched length.
- 400: Attr query parameter invalid.
- 400: Value query parameter has invalid length.
- 400: Attr query parameter is not numerical when a value range is passed.
- 400: Value query parameter is not a number when a value range is passed.
- 400: Missing required at least one query parameter.
- 400: Sort query parameter is not numerical.

## POST /contact
**Returned Data Format**: Text

**Description:** 
Sends a message to a contact endpoint, including the name of the sender, their email, and a text message. Returns a response that indicates if the message has been sucessfully received or an error message.

**Supported Parameters**
* POST body parameters: 
  * `name` (required) - name of sender
  * `email` (required) - email of sender
  * `message` (required) - contact message

**Example Request:** `/contact`
* POST body parameters: 
  * `name='TW'`
  * `email='twei@caltech.edu'`
  * `message='Can I get some oxygen?'`

**Example Response:**
```Your message has been received!```

**Error Handling:**
* 400: Missing required parameters for name, email, message.
* 500: Something is wrong with the server. Please try again later.

**Example Request:** `/contact`
* POST body parameters: 
  * `name='TW'`
  * `message='Hello!'`

**Example Response:**
```Missing required parameters for name, email, message.```