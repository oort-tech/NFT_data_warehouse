import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';

const CreateNFT = ({ contract }) => {
  const [imageURL, setImageURL] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event) => {
    setImageURL(event.target.value);
  };

  const createNewNFT = async () => {
    try {
      setLoading(true);

      if (imageURL === '') {
        alert('Please enter a valid image URL.');
        setLoading(false);
        return;
      }

      const tx = await contract.createNFT(imageURL);
      await tx.wait();
      alert('NFT created successfully!');
      setImageURL('');
    } catch (error) {
      console.error('Error creating NFT:', error);
      alert('Error creating NFT. Check the console for more details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <Form>
        <Form.Group controlId="imageURL">
          <Form.Label>Image URL</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter image URL"
            value={imageURL}
            onChange={handleInputChange}
          />
        </Form.Group>
        <Button variant="secondary" onClick={createNewNFT} disabled={loading}>
          {loading ? 'Creating NFT...' : 'Create NFT'}
        </Button>
      </Form>
    </div>
  );
};

export default CreateNFT;
