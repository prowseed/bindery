import waitForImage from '../waitForImage';

test('Returns when image gets naturalWidth', (done) => {
  const mockImage = {
    src: 'test.jpg',
    addEventListener: () => {},
  };

  waitForImage(mockImage, () => {
    done();
  });

  setTimeout(() => {
    mockImage.naturalWidth = true;
  }, 100);
});

test('Error listener also returns', (done) => {
  let errorListener;
  const mockImage = {
    src: 'test.jpg',
    addEventListener: (name, func) => {
      errorListener = func;
    },
  };

  waitForImage(mockImage, () => {
    done();
  });

  setTimeout(() => {
    errorListener();
  }, 100);
});
